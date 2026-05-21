import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from models.student import Student, UserRole
from models.task import Task
from models.student_task import StudentTask, TaskStatus
from schemas.student import StudentCreate, StudentUpdate
from schemas.task import TaskCreate
from auth.jwt_handler import get_password_hash, verify_password

class StudentService:
    @staticmethod
    async def create_student(db: AsyncSession, student_in: StudentCreate) -> Student:
        # Check if email is already taken
        result = await db.execute(select(Student).where(Student.email == student_in.email))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A student with this email already exists."
            )
        
        hashed_pw = get_password_hash(student_in.password)
        new_student = Student(
            student_name=student_in.student_name,
            email=student_in.email,
            password=hashed_pw,
            department=student_in.department,
            joining_date=student_in.joining_date,
            role=UserRole.STUDENT
        )
        db.add(new_student)
        await db.flush()  # Generate UUID id for student

        # Auto-assign all existing tasks to the new student as 'Not Started'
        tasks_result = await db.execute(select(Task))
        tasks = tasks_result.scalars().all()
        for task in tasks:
            student_task = StudentTask(
                student_id=new_student.id,
                task_id=task.id,
                status=TaskStatus.NOT_STARTED
            )
            db.add(student_task)

        await db.commit()
        # Eagerload tasks relation for StudentResponse
        return await StudentService.get_student_by_id(db, new_student.id)

    @staticmethod
    async def authenticate_student(db: AsyncSession, email: str, password: str) -> Optional[Student]:
        result = await db.execute(select(Student).where(Student.email == email))
        student = result.scalars().first()
        if not student:
            return None
        if not verify_password(password, student.password):
            return None
        return student

    @staticmethod
    async def update_student(db: AsyncSession, student_id: uuid.UUID, student_in: StudentUpdate) -> Student:
        result = await db.execute(select(Student).where(Student.id == student_id))
        student = result.scalars().first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        
        if student_in.student_name is not None:
            student.student_name = student_in.student_name
        if student_in.email is not None:
            student.email = student_in.email
        if student_in.department is not None:
            student.department = student_in.department
        if student_in.joining_date is not None:
            student.joining_date = student_in.joining_date
        if student_in.password is not None:
            student.password = get_password_hash(student_in.password)
        if student_in.is_active is not None:
            student.is_active = student_in.is_active
        if student_in.role is not None:
            student.role = student_in.role
            
        await db.commit()
        return await StudentService.get_student_by_id(db, student_id)

    @staticmethod
    async def delete_student(db: AsyncSession, student_id: uuid.UUID) -> Student:
        result = await db.execute(select(Student).where(Student.id == student_id))
        student = result.scalars().first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        student.is_active = False
        await db.commit()
        return student

    @staticmethod
    async def get_student_tasks(db: AsyncSession, student_id: uuid.UUID) -> List[StudentTask]:
        result = await db.execute(
            select(StudentTask)
            .options(joinedload(StudentTask.task))
            .where(StudentTask.student_id == student_id)
            .order_by(StudentTask.task_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_student_tasks_filtered(
        db: AsyncSession, 
        student_id: uuid.UUID, 
        status_filter: Optional[str] = None
    ) -> List[StudentTask]:
        query = (
            select(StudentTask)
            .options(joinedload(StudentTask.task))
            .where(StudentTask.student_id == student_id)
        )
        if status_filter:
            query = query.where(StudentTask.status == status_filter)
        query = query.order_by(StudentTask.task_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_student_task(
        db: AsyncSession, 
        student_id: uuid.UUID, 
        task_id: int, 
        status_val: str, 
        notes_val: Optional[str] = None
    ) -> StudentTask:
        result = await db.execute(
            select(StudentTask)
            .options(joinedload(StudentTask.task))
            .where(and_(StudentTask.student_id == student_id, StudentTask.task_id == task_id))
        )
        student_task = result.scalars().first()
        if not student_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Task assignment not found for this student."
            )
        
        # Check transition and assign values
        student_task.status = TaskStatus(status_val)
        student_task.notes = notes_val
            
        if status_val == "Completed":
            student_task.completion_date = date.today()
        else:
            student_task.completion_date = None

        await db.commit()
        await db.refresh(student_task)
        return student_task

    @staticmethod
    async def get_all_students(db: AsyncSession) -> List[Student]:
        result = await db.execute(
            select(Student)
            .options(joinedload(Student.student_tasks))
            .order_by(Student.student_name)
        )
        return list(result.scalars().unique().all())

    @staticmethod
    async def get_students_filtered(
        db: AsyncSession, 
        search: Optional[str] = None, 
        is_active: Optional[bool] = None
    ) -> List[Student]:
        query = select(Student)
        if search:
            query = query.where(Student.student_name.ilike(f"%{search}%"))
        if is_active is not None:
            query = query.where(Student.is_active == is_active)
        query = query.options(joinedload(Student.student_tasks)).order_by(Student.student_name)
        
        result = await db.execute(query)
        return list(result.scalars().unique().all())

    @staticmethod
    async def get_student_by_id(db: AsyncSession, student_id: uuid.UUID) -> Optional[Student]:
        result = await db.execute(
            select(Student)
            .options(joinedload(Student.student_tasks).joinedload(StudentTask.task))
            .where(Student.id == student_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_tasks(db: AsyncSession) -> List[Task]:
        result = await db.execute(select(Task).order_by(Task.id))
        return list(result.scalars().all())

    @staticmethod
    async def create_task(db: AsyncSession, task_in: TaskCreate) -> Task:
        # Check if task already exists
        result = await db.execute(select(Task).where(Task.task_name == task_in.task_name))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A task with this name already exists."
            )
        
        new_task = Task(
            task_name=task_in.task_name,
            platform=task_in.platform,
            category=task_in.category,
            description=task_in.description
        )
        db.add(new_task)
        await db.flush()  # Obtain new_task.id
        
        # Auto-create student_task rows for ALL existing students with status 'Not Started'
        students_result = await db.execute(select(Student))
        students = students_result.scalars().all()
        for student in students:
            student_task = StudentTask(
                student_id=student.id,
                task_id=new_task.id,
                status=TaskStatus.NOT_STARTED
            )
            db.add(student_task)
            
        await db.commit()
        await db.refresh(new_task)
        return new_task

    @staticmethod
    async def get_task_progress(db: AsyncSession, task_id: int) -> List[Dict[str, Any]]:
        # Format: [{"student_name": str, "status": str, "completion_date": date}]
        query = (
            select(Student.student_name, StudentTask.status, StudentTask.completion_date)
            .join(StudentTask, Student.id == StudentTask.student_id)
            .where(StudentTask.task_id == task_id)
            .order_by(Student.student_name)
        )
        result = await db.execute(query)
        progress_list = []
        for row in result.all():
            progress_list.append({
                "student_name": row.student_name,
                "status": row.status.value if hasattr(row.status, "value") else row.status,
                "completion_date": row.completion_date
            })
        return progress_list

    # --- Analytics & Reporting Methods ---

    @staticmethod
    async def get_dashboard_summary(db: AsyncSession) -> Dict[str, Any]:
        # Fetch active students with role 'student'
        students_res = await db.execute(select(Student).where(Student.role == UserRole.STUDENT))
        students = students_res.scalars().all()
        total_students = len(students)
        
        # Fetch all tasks
        tasks_res = await db.execute(select(Task))
        tasks = tasks_res.scalars().all()
        total_tasks = len(tasks)
        
        # Fetch all student_tasks for those students
        student_ids = [s.id for s in students]
        if not student_ids:
            return {
                "total_students": 0,
                "total_tasks": total_tasks,
                "total_assignments": 0,
                "total_completed": 0,
                "total_in_progress": 0,
                "total_not_started": 0,
                "total_does_not_apply": 0,
                "overall_completion_rate": 0.0
            }
            
        st_res = await db.execute(select(StudentTask).where(StudentTask.student_id.in_(student_ids)))
        st_list = st_res.scalars().all()
        
        total_assignments = len(st_list)
        total_completed = sum(1 for st in st_list if st.status == TaskStatus.COMPLETED)
        total_in_progress = sum(1 for st in st_list if st.status == TaskStatus.IN_PROGRESS)
        total_not_started = sum(1 for st in st_list if st.status == TaskStatus.NOT_STARTED)
        total_does_not_apply = sum(1 for st in st_list if st.status == TaskStatus.DOES_NOT_APPLY)
        
        denominator = total_assignments - total_does_not_apply
        overall_completion_rate = (total_completed / denominator * 100) if denominator > 0 else 0.0
        
        return {
            "total_students": total_students,
            "total_tasks": total_tasks,
            "total_assignments": total_assignments,
            "total_completed": total_completed,
            "total_in_progress": total_in_progress,
            "total_not_started": total_not_started,
            "total_does_not_apply": total_does_not_apply,
            "overall_completion_rate": round(overall_completion_rate, 1)
        }

    @staticmethod
    async def get_student_wise_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        # Query all students with their tasks loaded
        result = await db.execute(
            select(Student)
            .options(joinedload(Student.student_tasks))
            .where(Student.role == UserRole.STUDENT)
        )
        students = result.scalars().unique().all()
        
        summaries = []
        for student in students:
            tasks = student.student_tasks
            completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
            in_progress = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
            not_started = sum(1 for t in tasks if t.status == TaskStatus.NOT_STARTED)
            does_not_apply = sum(1 for t in tasks if t.status == TaskStatus.DOES_NOT_APPLY)
            total = len(tasks)
            
            denominator = total - does_not_apply
            overall_progress = (completed / denominator * 100) if denominator > 0 else 0.0
            
            summaries.append({
                "student_name": student.student_name,
                "completed": completed,
                "in_progress": in_progress,
                "not_started": not_started,
                "does_not_apply": does_not_apply,
                "overall_progress": round(overall_progress, 1)
            })
            
        # Sort by overall_progress descending
        summaries.sort(key=lambda x: x["overall_progress"], reverse=True)
        return summaries

    @staticmethod
    async def get_task_wise_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        # Fetch all tasks with their student tasks
        result = await db.execute(
            select(Task)
            .options(joinedload(Task.student_tasks))
            .order_by(Task.id)
        )
        tasks = result.scalars().unique().all()
        
        summaries = []
        for task in tasks:
            st_list = task.student_tasks
            completed = sum(1 for st in st_list if st.status == TaskStatus.COMPLETED)
            in_progress = sum(1 for st in st_list if st.status == TaskStatus.IN_PROGRESS)
            not_started = sum(1 for st in st_list if st.status == TaskStatus.NOT_STARTED)
            does_not_apply = sum(1 for st in st_list if st.status == TaskStatus.DOES_NOT_APPLY)
            total = len(st_list)
            
            denominator = total - does_not_apply
            completion_rate = (completed / denominator * 100) if denominator > 0 else 0.0
            
            summaries.append({
                "task_name": task.task_name,
                "platform": task.platform.value if hasattr(task.platform, "value") else task.platform,
                "completed_count": completed,
                "in_progress_count": in_progress,
                "not_started_count": not_started,
                "does_not_apply_count": does_not_apply,
                "completion_rate": round(completion_rate, 1)
            })
        return summaries

    @staticmethod
    async def get_platform_wise_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        task_summaries = await StudentService.get_task_wise_summary(db)
        
        platform_groups = {}
        for ts in task_summaries:
            plat = ts["platform"]
            if plat not in platform_groups:
                platform_groups[plat] = []
            platform_groups[plat].append(ts["completion_rate"])
            
        summaries = []
        for plat, rates in platform_groups.items():
            total_tasks = len(rates)
            avg_completion_rate = sum(rates) / total_tasks if total_tasks > 0 else 0.0
            summaries.append({
                "platform": plat,
                "total_tasks": total_tasks,
                "avg_completion_rate": round(avg_completion_rate, 1)
            })
        return summaries

    @staticmethod
    async def get_grid_analytics(db: AsyncSession) -> Dict[str, Any]:
        # Fetch all tasks in order of id
        tasks_res = await db.execute(select(Task).order_by(Task.id))
        tasks = tasks_res.scalars().all()
        task_names = [t.task_name for t in tasks]
        
        # Fetch all students with their tasks loaded
        students_res = await db.execute(
            select(Student)
            .options(joinedload(Student.student_tasks))
            .where(Student.role == UserRole.STUDENT)
            .order_by(Student.student_name)
        )
        students = students_res.scalars().unique().all()
        
        grid_students = []
        for student in students:
            st_map = {st.task_id: st.status.value if hasattr(st.status, "value") else st.status for st in student.student_tasks}
            statuses = []
            for task in tasks:
                statuses.append(st_map.get(task.id, "Not Started"))
                
            grid_students.append({
                "student_name": student.student_name,
                "statuses": statuses
            })
            
        return {
            "tasks": task_names,
            "students": grid_students
        }

    # --- Student-specific Analytics (Legacy fallback) ---

    @staticmethod
    async def get_student_dashboard_analytics(db: AsyncSession, student_id: uuid.UUID) -> Dict[str, Any]:
        tasks = await StudentService.get_student_tasks(db, student_id)
        
        completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        in_progress = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
        not_started = sum(1 for t in tasks if t.status == TaskStatus.NOT_STARTED)
        does_not_apply = sum(1 for t in tasks if t.status == TaskStatus.DOES_NOT_APPLY)
        total = len(tasks)

        completion_rate = (completed / total * 100) if total > 0 else 0.0

        return {
            "total_tasks": total,
            "completed": completed,
            "in_progress": in_progress,
            "not_started": not_started,
            "does_not_apply": does_not_apply,
            "completion_rate": round(completion_rate, 1)
        }

    @staticmethod
    async def get_system_analytics(db: AsyncSession) -> Dict[str, Any]:
        students_result = await db.execute(select(Student).where(Student.role == UserRole.STUDENT))
        students = students_result.scalars().all()
        
        total_students = len(students)
        student_summaries = []
        
        for s in students:
            stats = await StudentService.get_student_dashboard_analytics(db, s.id)
            student_summaries.append({
                "student_id": str(s.id),
                "student_name": s.student_name,
                "email": s.email,
                **stats
            })

        # Calculate platform aggregated statistics
        tasks_result = await db.execute(select(StudentTask).options(joinedload(StudentTask.task)))
        all_assigned = tasks_result.scalars().all()

        platform_stats = {}
        for item in all_assigned:
            platform = item.task.platform.value
            if platform not in platform_stats:
                platform_stats[platform] = {"total": 0, "completed": 0}
            platform_stats[platform]["total"] += 1
            if item.status == TaskStatus.COMPLETED:
                platform_stats[platform]["completed"] += 1

        return {
            "total_students": total_students,
            "student_summaries": student_summaries,
            "platform_analytics": [
                {
                    "platform": k,
                    "total": v["total"],
                    "completed": v["completed"],
                    "completion_rate": round(v["completed"] / v["total"] * 100, 1) if v["total"] > 0 else 0.0
                }
                for k, v in platform_stats.items()
            ]
        }
