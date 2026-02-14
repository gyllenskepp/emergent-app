from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from exponent_server_sdk import PushClient, PushMessage
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class User(UserBase):
    user_id: str
    role: str = "member"  # admin, member, guest
    phone: Optional[str] = None
    notification_preferences: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": False,
        "categories": {
            "open_game_night": False,
            "member_night": False,
            "tournament": False,
            "special_event": False,
            "news": False
        },
        "reminder_times": ["24h"]  # 24h, 3h, 1h
    })
    push_token: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    push_token: Optional[str] = None

class EventCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str  # open_game_night, member_night, tournament, special_event
    color: str = "#E63946"

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str = "Odengatan 31, Sandviken"
    start_time: datetime
    end_time: datetime
    category: str  # slug reference
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    title: str
    description: str
    location: str = "Odengatan 31, Sandviken"
    start_time: datetime
    end_time: datetime
    category: str

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    category: Optional[str] = None

class News(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    body: str
    image: Optional[str] = None  # base64
    publish_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsCreate(BaseModel):
    title: str
    body: str
    image: Optional[str] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    image: Optional[str] = None

class UserSession(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Ej autentiserad")
    return user

async def require_admin(request: Request) -> User:
    """Require admin user"""
    user = await require_auth(request)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin-behörighet krävs")
    return user

# ==================== SEED DATA ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def seed_database():
    """Seed database with default categories and admin user"""
    # Seed categories
    default_categories = [
        {"id": "cat_open", "name": "Öppen spelkväll", "slug": "open_game_night", "color": "#E63946"},
        {"id": "cat_member", "name": "Medlemskväll", "slug": "member_night", "color": "#457B9D"},
        {"id": "cat_tournament", "name": "Turnering", "slug": "tournament", "color": "#2A9D8F"},
        {"id": "cat_special", "name": "Specialevent", "slug": "special_event", "color": "#F4A261"},
    ]
    
    for cat in default_categories:
        existing = await db.categories.find_one({"slug": cat["slug"]})
        if not existing:
            await db.categories.insert_one(cat)
            logger.info(f"Created category: {cat['name']}")
    
    # Seed admin user with password
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@borka.se")
    admin_password = os.environ.get("ADMIN_PASSWORD", "borka2024")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email,
            "name": "BORKA Admin",
            "password_hash": hash_password(admin_password),
            "picture": None,
            "role": "admin",
            "phone": None,
            "auth_type": "email",  # email or google
            "notification_preferences": {
                "enabled": True,
                "categories": {
                    "open_game_night": True,
                    "member_night": True,
                    "tournament": True,
                    "special_event": True,
                    "news": True
                },
                "reminder_times": ["24h", "1h"]
            },
            "push_token": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_user)
        logger.info(f"Created admin user: {admin_email} with password: {admin_password}")
    
    # Seed some sample events
    existing_events = await db.events.count_documents({})
    if existing_events == 0:
        admin = await db.users.find_one({"email": admin_email})
        if admin:
            sample_events = [
                {
                    "id": str(uuid.uuid4()),
                    "title": "Öppen spelkväll - Tisdag",
                    "description": "Välkommen till vår öppna spelkväll! Ta med vänner eller kom ensam - vi har spel för alla.",
                    "location": "Odengatan 31, Sandviken",
                    "start_time": datetime.now(timezone.utc).replace(hour=18, minute=0) + timedelta(days=1),
                    "end_time": datetime.now(timezone.utc).replace(hour=21, minute=30) + timedelta(days=1),
                    "category": "open_game_night",
                    "created_by": admin["user_id"],
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                },
                {
                    "id": str(uuid.uuid4()),
                    "title": "Medlemskväll",
                    "description": "Exklusiv spelkväll för BORKA-medlemmar. Provspela nya spel innan de släpps!",
                    "location": "Odengatan 31, Sandviken",
                    "start_time": datetime.now(timezone.utc).replace(hour=18, minute=0) + timedelta(days=5),
                    "end_time": datetime.now(timezone.utc).replace(hour=22, minute=0) + timedelta(days=5),
                    "category": "member_night",
                    "created_by": admin["user_id"],
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            ]
            for event in sample_events:
                await db.events.insert_one(event)
            logger.info("Created sample events")
    
    # Seed some sample news
    existing_news = await db.news.count_documents({})
    if existing_news == 0:
        admin = await db.users.find_one({"email": admin_email})
        if admin:
            sample_news = [
                {
                    "id": str(uuid.uuid4()),
                    "title": "Välkommen till BORKA-appen!",
                    "body": "Nu kan du följa alla våra event och nyheter direkt i appen. Glöm inte att aktivera notiser för att inte missa något!",
                    "image": None,
                    "publish_date": datetime.now(timezone.utc),
                    "created_by": admin["user_id"],
                    "created_at": datetime.now(timezone.utc)
                }
            ]
            for news in sample_news:
                await db.news.insert_one(news)
            logger.info("Created sample news")

# ==================== AUTH ENDPOINTS ====================

class EmailLoginRequest(BaseModel):
    email: str
    password: str

class EmailRegisterRequest(BaseModel):
    email: str
    password: str
    name: str

@api_router.post("/auth/login")
async def email_login(request: EmailLoginRequest, response: Response):
    """Login with email and password"""
    user = await db.users.find_one({"email": request.email.lower()}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Fel e-post eller lösenord")
    
    # Check if user has a password (email auth user)
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Detta konto använder Google-inloggning")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Fel e-post eller lösenord")
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_token": session_token,
        "user_id": user["user_id"],
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Remove old sessions
    await db.user_sessions.delete_many({"user_id": user["user_id"]})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Remove password_hash from response
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    logger.info(f"User logged in: {request.email}")
    return {"user": user_response, "session_token": session_token}

@api_router.post("/auth/register")
async def email_register(request: EmailRegisterRequest, response: Response):
    """Register with email and password"""
    email = request.email.lower().strip()
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="E-postadressen är redan registrerad")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id,
        "email": email,
        "name": request.name,
        "password_hash": hash_password(request.password),
        "picture": None,
        "role": "member",
        "phone": None,
        "auth_type": "email",
        "notification_preferences": {
            "enabled": False,
            "categories": {
                "open_game_night": False,
                "member_night": False,
                "tournament": False,
                "special_event": False,
                "news": False
            },
            "reminder_times": ["24h"]
        },
        "push_token": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(new_user)
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Remove password_hash from response
    user_response = {k: v for k, v in new_user.items() if k != "password_hash"}
    
    logger.info(f"New user registered: {email}")
    return {"user": user_response, "session_token": session_token}

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id krävs")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Ogiltig session")
        
        auth_data = auth_response.json()
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    # Check if this should be admin (first user or configured admin email)
    admin_emails = os.environ.get("ADMIN_EMAILS", "").split(",")
    admin_emails = [e.strip().lower() for e in admin_emails if e.strip()]
    
    # Check if ANY admin exists
    existing_admin = await db.users.find_one({"role": "admin"})
    
    # Determine role: admin if email is in ADMIN_EMAILS list OR if no admin exists yet (first user becomes admin)
    is_admin = email.lower() in admin_emails or (not existing_admin and not existing_user)
    
    if existing_user:
        user_id = existing_user["user_id"]
        update_data = {"name": name, "picture": picture}
        # Upgrade to admin if needed
        if is_admin and existing_user.get("role") != "admin":
            update_data["role"] = "admin"
            logger.info(f"Upgraded user {email} to admin")
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "admin" if is_admin else "member"
        if is_admin:
            logger.info(f"Creating new admin user: {email}")
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "phone": None,
            "notification_preferences": {
                "enabled": False,
                "categories": {
                    "open_game_night": False,
                    "member_night": False,
                    "tournament": False,
                    "special_event": False,
                    "news": False
                },
                "reminder_times": ["24h"]
            },
            "push_token": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Ej autentiserad")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Utloggad"}

# ==================== USER ENDPOINTS ====================

@api_router.get("/users/me")
async def get_user_profile(request: Request):
    """Get current user profile"""
    user = await require_auth(request)
    return user.model_dump()

@api_router.put("/users/me")
async def update_user_profile(request: Request, update: UserUpdate):
    """Update current user profile"""
    user = await require_auth(request)
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.put("/users/me/push-token")
async def update_push_token(request: Request):
    """Update user's push notification token"""
    user = await require_auth(request)
    body = await request.json()
    push_token = body.get("push_token")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"push_token": push_token}}
    )
    
    return {"message": "Push token uppdaterad"}

# ==================== EVENTS ENDPOINTS ====================

@api_router.get("/events")
async def get_events(category: Optional[str] = None, upcoming: bool = True):
    """Get all events, optionally filtered"""
    query = {}
    if category and category != "all":
        query["category"] = category
    if upcoming:
        query["start_time"] = {"$gte": datetime.now(timezone.utc)}
    
    events = await db.events.find(query, {"_id": 0}).sort("start_time", 1).to_list(100)
    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Get single event"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event hittades inte")
    return event

@api_router.post("/events")
async def create_event(request: Request, event: EventCreate):
    """Create new event (admin only)"""
    user = await require_admin(request)
    
    event_doc = Event(
        **event.model_dump(),
        created_by=user.user_id
    )
    
    await db.events.insert_one(event_doc.model_dump())
    
    # Send push notifications to subscribed users
    await send_new_event_notifications(event_doc)
    
    return event_doc.model_dump()

@api_router.put("/events/{event_id}")
async def update_event(request: Request, event_id: str, update: EventUpdate):
    """Update event (admin only)"""
    user = await require_admin(request)
    
    existing = await db.events.find_one({"id": event_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Event hittades inte")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.events.update_one(
        {"id": event_id},
        {"$set": update_data}
    )
    
    # Send update notifications if time/location changed
    if "start_time" in update_data or "location" in update_data:
        updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
        await send_event_update_notifications(Event(**updated_event))
    
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    return updated

@api_router.delete("/events/{event_id}")
async def delete_event(request: Request, event_id: str):
    """Delete event (admin only)"""
    await require_admin(request)
    
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event hittades inte")
    
    return {"message": "Event borttaget"}

# ==================== NEWS ENDPOINTS ====================

@api_router.get("/news")
async def get_news():
    """Get all news"""
    news = await db.news.find({}, {"_id": 0}).sort("publish_date", -1).to_list(100)
    return news

@api_router.get("/news/{news_id}")
async def get_news_item(news_id: str):
    """Get single news item"""
    news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="Nyhet hittades inte")
    return news

@api_router.post("/news")
async def create_news(request: Request, news: NewsCreate):
    """Create news (admin only)"""
    user = await require_admin(request)
    
    news_doc = News(
        **news.model_dump(),
        created_by=user.user_id
    )
    
    await db.news.insert_one(news_doc.model_dump())
    
    # Send push notifications
    await send_news_notifications(news_doc)
    
    return news_doc.model_dump()

@api_router.put("/news/{news_id}")
async def update_news(request: Request, news_id: str, update: NewsUpdate):
    """Update news (admin only)"""
    await require_admin(request)
    
    existing = await db.news.find_one({"id": news_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Nyhet hittades inte")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    await db.news.update_one(
        {"id": news_id},
        {"$set": update_data}
    )
    
    updated = await db.news.find_one({"id": news_id}, {"_id": 0})
    return updated

@api_router.delete("/news/{news_id}")
async def delete_news(request: Request, news_id: str):
    """Delete news (admin only)"""
    await require_admin(request)
    
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nyhet hittades inte")
    
    return {"message": "Nyhet borttagen"}

# ==================== CATEGORIES ENDPOINTS ====================

@api_router.get("/categories")
async def get_categories():
    """Get all event categories"""
    categories = await db.categories.find({}, {"_id": 0}).to_list(20)
    return categories

# ==================== CALENDAR ICS ENDPOINTS ====================

@api_router.get("/calendar/ics", response_class=PlainTextResponse)
async def get_calendar_ics():
    """Get ICS feed for all events"""
    events = await db.events.find({}, {"_id": 0}).sort("start_time", 1).to_list(500)
    
    ics_content = generate_ics(events)
    
    return PlainTextResponse(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=borka-kalender.ics"}
    )

@api_router.get("/calendar/event/{event_id}/ics", response_class=PlainTextResponse)
async def get_event_ics(event_id: str):
    """Get ICS file for single event"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event hittades inte")
    
    ics_content = generate_ics([event])
    
    return PlainTextResponse(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=borka-event-{event_id}.ics"}
    )

def generate_ics(events: List[dict]) -> str:
    """Generate ICS calendar content"""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//BORKA//Brädspel och Rollspel//SV",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:BORKA Kalender",
        "X-WR-TIMEZONE:Europe/Stockholm",
    ]
    
    for event in events:
        start_time = event["start_time"]
        end_time = event["end_time"]
        
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{event['id']}@borka-sandviken.se",
            f"DTSTART:{start_time.strftime('%Y%m%dT%H%M%SZ')}",
            f"DTEND:{end_time.strftime('%Y%m%dT%H%M%SZ')}",
            f"SUMMARY:{event['title']}",
            f"DESCRIPTION:{event.get('description', '').replace(chr(10), ' ')}",
            f"LOCATION:{event.get('location', 'Odengatan 31, Sandviken')}",
            f"DTSTAMP:{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            "END:VEVENT",
        ])
    
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)

# ==================== PUSH NOTIFICATIONS ====================

async def send_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """Send push notification using Expo"""
    try:
        message = PushMessage(
            to=push_token,
            title=title,
            body=body,
            data=data or {},
            sound="default"
        )
        PushClient().publish(message)
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")

async def send_new_event_notifications(event: Event):
    """Send notifications for new event"""
    # Find users who have enabled notifications for this category
    users = await db.users.find({
        "push_token": {"$ne": None},
        "notification_preferences.enabled": True,
        f"notification_preferences.categories.{event.category}": True
    }, {"_id": 0}).to_list(1000)
    
    category_names = {
        "open_game_night": "Öppen spelkväll",
        "member_night": "Medlemskväll",
        "tournament": "Turnering",
        "special_event": "Specialevent"
    }
    
    for user in users:
        if user.get("push_token"):
            await send_push_notification(
                user["push_token"],
                f"Nytt event: {event.title}",
                f"{category_names.get(event.category, event.category)} - {event.start_time.strftime('%d/%m %H:%M')}",
                {"event_id": event.id, "type": "new_event"}
            )

async def send_event_update_notifications(event: Event):
    """Send notifications for event updates"""
    users = await db.users.find({
        "push_token": {"$ne": None},
        "notification_preferences.enabled": True,
        f"notification_preferences.categories.{event.category}": True
    }, {"_id": 0}).to_list(1000)
    
    for user in users:
        if user.get("push_token"):
            await send_push_notification(
                user["push_token"],
                f"Event uppdaterat: {event.title}",
                f"Tid eller plats har ändrats - kolla detaljerna!",
                {"event_id": event.id, "type": "event_update"}
            )

async def send_news_notifications(news: News):
    """Send notifications for new news"""
    users = await db.users.find({
        "push_token": {"$ne": None},
        "notification_preferences.enabled": True,
        "notification_preferences.categories.news": True
    }, {"_id": 0}).to_list(1000)
    
    for user in users:
        if user.get("push_token"):
            await send_push_notification(
                user["push_token"],
                f"BORKA Nyhet: {news.title}",
                news.body[:100] + "..." if len(news.body) > 100 else news.body,
                {"news_id": news.id, "type": "news"}
            )

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    """Run on startup"""
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "BORKA API", "version": "1.0.0"}
