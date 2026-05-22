import asyncio
import os
from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete
from dotenv import load_dotenv

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

load_dotenv()

from database import Base
from models.trainee import Trainee, UserRole
from models.task import Task
from models.trainee_task import TraineeTask, TaskStatus
from auth.jwt_handler import get_password_hash

# Exact trainee tasks statuses from spreadsheet
SPREADSHEET_DATA = {
    "Mahima": {
        "PHP": "Does Not Apply",
        "Python": "Completed",
        "SQL": "In Progress",
        "Easy-ProbSolving": "Completed",
        "Easy-Python": "In Progress",
        "SE Intern": "Completed",
        "SE": "Completed",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Completed",
        "ProbSolving Intermediate": "Completed",
        "SQL basic": "Completed",
        "SQL Intermediate": "Completed",
        "Akamai": "In Progress"
    },
    "Dhanesh": {
        "PHP": "Does Not Apply",
        "Python": "Completed",
        "SQL": "Completed",
        "Easy-ProbSolving": "Completed",
        "Easy-Python": "Not Started",
        "SE Intern": "Completed",
        "SE": "Completed",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Completed",
        "ProbSolving Intermediate": "Completed",
        "SQL basic": "Completed",
        "SQL Intermediate": "Completed",
        "Akamai": "Does Not Apply"
    },
    "Vishal": {
        "PHP": "Not Started",
        "Python": "Completed",
        "SQL": "Completed",
        "Easy-ProbSolving": "In Progress",
        "Easy-Python": "Not Started",
        "SE Intern": "Completed",
        "SE": "Not Started",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Not Started",
        "ProbSolving Intermediate": "Not Started",
        "SQL basic": "Not Started",
        "SQL Intermediate": "Not Started",
        "Akamai": "Does Not Apply"
    },
    "Naveen": {
        "PHP": "Not Started",
        "Python": "Completed",
        "SQL": "Not Started",
        "Easy-ProbSolving": "In Progress",
        "Easy-Python": "Not Started",
        "SE Intern": "Completed",
        "SE": "Not Started",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Completed",
        "ProbSolving Intermediate": "Not Started",
        "SQL basic": "Completed",
        "SQL Intermediate": "Not Started",
        "Akamai": "Does Not Apply"
    },
    "Achyut": {
        "PHP": "Completed",
        "Python": "In Progress",
        "SQL": "Not Started",
        "Easy-ProbSolving": "In Progress",
        "Easy-Python": "Not Started",
        "SE Intern": "Completed",
        "SE": "Not Started",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Completed",
        "ProbSolving Intermediate": "In Progress",
        "SQL basic": "Completed",
        "SQL Intermediate": "In Progress",
        "Akamai": "Does Not Apply"
    },
    "Bneru": {
        "PHP": "Not Started",
        "Python": "In Progress",
        "SQL": "Not Started",
        "Easy-ProbSolving": "In Progress",
        "Easy-Python": "Not Started",
        "SE Intern": "Completed",
        "SE": "Not Started",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Completed",
        "ProbSolving Intermediate": "Not Started",
        "SQL basic": "Completed",
        "SQL Intermediate": "Not Started",
        "Akamai": "Does Not Apply"
    },
    "Shubnam": {
        "PHP": "Does Not Apply",
        "Python": "Not Started",
        "SQL": "Not Started",
        "Easy-ProbSolving": "Not Started",
        "Easy-Python": "Not Started",
        "SE Intern": "Completed",
        "SE": "Not Started",
        "Python Basic": "Completed",
        "ProbSolving Basic": "Completed",
        "ProbSolving Intermediate": "Not Started",
        "SQL basic": "Completed",
        "SQL Intermediate": "Not Started",
        "Akamai": "Not Started"
    }
}

TRAINEE_PROFILES = {
    "Mahima": {
        "technologies": ["Python", "FastAPI", "React"],
        "hackerrank_username": "mahima_tc",
        "hackerrank_score": 380,
        "hackerrank_solved": 19
    },
    "Dhanesh": {
        "technologies": ["Python", "QA"],
        "hackerrank_username": "dhanesh_tc",
        "hackerrank_score": 410,
        "hackerrank_solved": 21
    },
    "Vishal": {
        "technologies": ["PHP", "QA"],
        "hackerrank_username": "vishal_tc",
        "hackerrank_score": 120,
        "hackerrank_solved": 6
    },
    "Naveen": {
        "technologies": ["Python", "React"],
        "hackerrank_username": "naveen_tc",
        "hackerrank_score": 240,
        "hackerrank_solved": 12
    },
    "Achyut": {
        "technologies": ["PHP", "FastAPI", "React"],
        "hackerrank_username": "achyut_tc",
        "hackerrank_score": 310,
        "hackerrank_solved": 15
    },
    "Bneru": {
        "technologies": ["Python", "FastAPI"],
        "hackerrank_username": "bneru_tc",
        "hackerrank_score": 180,
        "hackerrank_solved": 9
    },
    "Shubnam": {
        "technologies": ["QA"],
        "hackerrank_username": "shubnam_tc",
        "hackerrank_score": 90,
        "hackerrank_solved": 4
    }
}

TASK_MAPPING = {
    "PHP": "Codechef free coding challenges PHP",
    "Python": "Codechef free coding challenges Python",
    "SQL": "Codechef free coding challenges SQL",
    "Easy-ProbSolving": "Hackerrank Easy Challenges - Problem Solving",
    "Easy-Python": "Hackerrank Easy Challenges - Python",
    "SE Intern": "Hackerrank SE Intern",
    "SE": "Hackerrank SE",
    "Python Basic": "Hackerrank Python Basic",
    "ProbSolving Basic": "Hackerrank Problem Solving Basic",
    "ProbSolving Intermediate": "Hackerrank Problem Solving Intermediate",
    "SQL basic": "Hackerrank SQL basic",
    "SQL Intermediate": "Hackerrank SQL Intermediate",
    "Akamai": "Akamai EmpowHer Codeathon 3.0 (Woman)"
}

STATUS_MAP = {
    "Completed": TaskStatus.COMPLETED,
    "In Progress": TaskStatus.IN_PROGRESS,
    "Not Started": TaskStatus.NOT_STARTED,
    "Does Not Apply": TaskStatus.DOES_NOT_APPLY
}

async def seed_db():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found!")
        return

    if "?" in url:
        clean_url = url.split("?")[0]
    else:
        clean_url = url

    # Disable SQLAlchemy asyncpg dialect prepared statement caching for PgBouncer compatibility
    clean_url = f"{clean_url}?prepared_statement_cache_size=0"

    engine = create_async_engine(clean_url, connect_args={"ssl": True, "statement_cache_size": 0})
    AsyncSessionMaker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionMaker() as session:
        print("Purging existing trainee tasks assignments...")
        await session.execute(delete(TraineeTask))
        await session.execute(delete(Trainee))
        await session.commit()

        # 1. Create Admin
        hashed_password = get_password_hash("Welcome@123")
        admin_user = Trainee(
            trainee_name="Admin",
            email="admin@tckade.com",
            password=hashed_password,
            role=UserRole.ADMIN,
            department="Management",
            is_active=True,
            technologies=["Python", "PHP", "QA", "FastAPI", "React"],
            hackerrank_username="admin_tc",
            hackerrank_score=500,
            hackerrank_solved=25
        )
        session.add(admin_user)
        print("Admin trainee created.")

        # Fetch/seed tasks
        result = await session.execute(select(Task))
        tasks = result.scalars().all()
        task_by_name = {t.task_name: t for t in tasks}

        from models.task import PlatformType
        TASK_DETAILS = [
            ("Codechef free coding challenges PHP", PlatformType.CODECHEF, "PHP", "Codechef free coding challenges PHP language track."),
            ("Codechef free coding challenges Python", PlatformType.CODECHEF, "Python", "Codechef free coding challenges Python language track."),
            ("Codechef free coding challenges SQL", PlatformType.CODECHEF, "SQL", "Codechef free coding challenges SQL track."),
            ("Hackerrank Easy Challenges - Problem Solving", PlatformType.HACKERRANK, "Problem Solving", "Hackerrank Easy Challenges in Problem Solving."),
            ("Hackerrank Easy Challenges - Python", PlatformType.HACKERRANK, "Python", "Hackerrank Easy Challenges in Python track."),
            ("Hackerrank SE Intern", PlatformType.HACKERRANK, "SE", "Hackerrank Software Engineering Intern preparation challenges."),
            ("Hackerrank SE", PlatformType.HACKERRANK, "SE", "Hackerrank Software Engineering track."),
            ("Hackerrank Python Basic", PlatformType.HACKERRANK, "Python", "Hackerrank Python Basic skill certification challenges."),
            ("Hackerrank Problem Solving Basic", PlatformType.HACKERRANK, "Problem Solving", "Hackerrank Problem Solving Basic skill certification challenges."),
            ("Hackerrank Problem Solving Intermediate", PlatformType.HACKERRANK, "Problem Solving", "Hackerrank Problem Solving Intermediate skill certification challenges."),
            ("Hackerrank SQL basic", PlatformType.HACKERRANK, "SQL", "Hackerrank SQL Basic skill certification challenges."),
            ("Hackerrank SQL Intermediate", PlatformType.HACKERRANK, "SQL", "Hackerrank SQL Intermediate skill certification challenges."),
            ("Akamai EmpowHer Codeathon 3.0 (Woman)", PlatformType.AKAMAI, "SE", "Akamai EmpowHer Codeathon 3.0 programming challenges.")
        ]

        for name, plat, cat, desc in TASK_DETAILS:
            if name not in task_by_name:
                print(f"Task '{name}' not found, seeding task...")
                new_t = Task(task_name=name, platform=plat, category=cat, description=desc)
                session.add(new_t)
                await session.flush()
                task_by_name[name] = new_t

        # 2. Create Trainees and assignments
        for trainee_name, task_statuses in SPREADSHEET_DATA.items():
            email = f"{trainee_name.lower()}@tckade.com"
            profile = TRAINEE_PROFILES[trainee_name]

            trainee = Trainee(
                trainee_name=trainee_name,
                email=email,
                password=hashed_password,
                role=UserRole.TRAINEE,
                department="Development",
                is_active=True,
                technologies=profile["technologies"],
                hackerrank_username=profile["hackerrank_username"],
                hackerrank_score=profile["hackerrank_score"],
                hackerrank_solved=profile["hackerrank_solved"]
            )
            session.add(trainee)
            await session.flush()

            print(f"Seeding trainee: {trainee_name} ({email}) with tech tags: {profile['technologies']}...")

            # Map tasks
            for short_name, status_str in task_statuses.items():
                full_task_name = TASK_MAPPING[short_name]
                task_obj = task_by_name[full_task_name]
                db_status = STATUS_MAP[status_str]

                completion_date = date.today() if db_status == TaskStatus.COMPLETED else None

                trainee_task = TraineeTask(
                    trainee_id=trainee.id,
                    task_id=task_obj.id,
                    status=db_status,
                    completion_date=completion_date,
                    notes=f"Initial seed status: {status_str}."
                )
                session.add(trainee_task)

        await session.commit()
        print("Database successfully seeded with trainee reports!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
