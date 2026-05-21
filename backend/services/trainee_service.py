import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from models.trainee import Trainee, UserRole
from models.task import Task
from models.trainee_task import TraineeTask, TaskStatus
from models.notification import Notification
from schemas.trainee import TraineeCreate, TraineeUpdate
from schemas.task import TaskCreate
from auth.jwt_handler import get_password_hash, verify_password

class TraineeService:
    @staticmethod
    async def create_trainee(db: AsyncSession, trainee_in: TraineeCreate) -> Trainee:
        # Check if email is already taken
        result = await db.execute(select(Trainee).where(Trainee.email == trainee_in.email))
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A trainee with this email already exists."
            )
        
        hashed_pw = get_password_hash(trainee_in.password)
        new_trainee = Trainee(
            trainee_name=trainee_in.trainee_name,
            email=trainee_in.email,
            password=hashed_pw,
            department=trainee_in.department,
            joining_date=trainee_in.joining_date,
            role=UserRole.TRAINEE,
            technologies=trainee_in.technologies or [],
            hackerrank_username=trainee_in.hackerrank_username,
            hackerrank_score=trainee_in.hackerrank_score,
            hackerrank_solved=trainee_in.hackerrank_solved
        )
        db.add(new_trainee)
        await db.flush()  # Generate UUID id for trainee

        # Auto-assign all existing tasks to the new trainee as 'Not Started'
        tasks_result = await db.execute(select(Task))
        tasks = tasks_result.scalars().all()
        for task in tasks:
            trainee_task = TraineeTask(
                trainee_id=new_trainee.id,
                task_id=task.id,
                status=TaskStatus.NOT_STARTED
            )
            db.add(trainee_task)

        await db.commit()
        return await TraineeService.get_trainee_by_id(db, new_trainee.id)

    @staticmethod
    async def authenticate_trainee(db: AsyncSession, email: str, password: str) -> Optional[Trainee]:
        result = await db.execute(select(Trainee).where(Trainee.email == email))
        trainee = result.scalars().first()
        if not trainee:
            return None
        if not verify_password(password, trainee.password):
            return None
        return trainee

    @staticmethod
    async def update_trainee(db: AsyncSession, trainee_id: uuid.UUID, trainee_in: TraineeUpdate, updated_by_role: Optional[str] = None) -> Trainee:
        result = await db.execute(select(Trainee).where(Trainee.id == trainee_id))
        trainee = result.scalars().first()
        if not trainee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainee not found")
        
        if trainee_in.trainee_name is not None:
            trainee.trainee_name = trainee_in.trainee_name
        if trainee_in.email is not None:
            trainee.email = trainee_in.email
        if trainee_in.department is not None:
            trainee.department = trainee_in.department
        if trainee_in.joining_date is not None:
            trainee.joining_date = trainee_in.joining_date
        if trainee_in.password is not None:
            trainee.password = get_password_hash(trainee_in.password)
        if trainee_in.is_active is not None:
            trainee.is_active = trainee_in.is_active
        if trainee_in.role is not None:
            trainee.role = trainee_in.role
        if trainee_in.technologies is not None:
            trainee.technologies = trainee_in.technologies
        if trainee_in.hackerrank_username is not None:
            trainee.hackerrank_username = trainee_in.hackerrank_username
        if trainee_in.hackerrank_score is not None:
            trainee.hackerrank_score = trainee_in.hackerrank_score
        if trainee_in.hackerrank_solved is not None:
            trainee.hackerrank_solved = trainee_in.hackerrank_solved
            
        if updated_by_role == "admin":
            notification = Notification(
                trainee_id=trainee_id,
                title="Profile Updated",
                message="Your profile details have been updated by the administrator."
            )
            db.add(notification)
            
        await db.commit()
        return await TraineeService.get_trainee_by_id(db, trainee_id)

    @staticmethod
    async def delete_trainee(db: AsyncSession, trainee_id: uuid.UUID) -> Trainee:
        result = await db.execute(select(Trainee).where(Trainee.id == trainee_id))
        trainee = result.scalars().first()
        if not trainee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainee not found")
        trainee.is_active = False
        await db.commit()
        return trainee

    @staticmethod
    async def get_trainee_tasks(db: AsyncSession, trainee_id: uuid.UUID) -> List[TraineeTask]:
        result = await db.execute(
            select(TraineeTask)
            .options(joinedload(TraineeTask.task))
            .where(TraineeTask.trainee_id == trainee_id)
            .order_by(TraineeTask.task_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_trainee_tasks_filtered(
        db: AsyncSession, 
        trainee_id: uuid.UUID, 
        status_filter: Optional[str] = None
    ) -> List[TraineeTask]:
        query = (
            select(TraineeTask)
            .options(joinedload(TraineeTask.task))
            .where(TraineeTask.trainee_id == trainee_id)
        )
        if status_filter:
            query = query.where(TraineeTask.status == status_filter)
        query = query.order_by(TraineeTask.task_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_trainee_task(
        db: AsyncSession, 
        trainee_id: uuid.UUID, 
        task_id: int, 
        status_val: str, 
        notes_val: Optional[str] = None,
        updated_by_role: Optional[str] = None
    ) -> TraineeTask:
        result = await db.execute(
            select(TraineeTask)
            .options(joinedload(TraineeTask.task))
            .where(and_(TraineeTask.trainee_id == trainee_id, TraineeTask.task_id == task_id))
        )
        trainee_task = result.scalars().first()

        if not trainee_task:
            # Auto-create the assignment record if it's missing (e.g. task added after trainee was created,
            # or a previous delete left an orphaned grid cell). Verify both trainee and task exist first.
            trainee_check = await db.execute(select(Trainee).where(Trainee.id == trainee_id))
            if not trainee_check.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Trainee not found."
                )
            task_check = await db.execute(select(Task).where(Task.id == task_id))
            task_obj = task_check.scalars().first()
            if not task_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Task not found."
                )
            trainee_task = TraineeTask(
                trainee_id=trainee_id,
                task_id=task_id,
                status=TaskStatus.NOT_STARTED
            )
            db.add(trainee_task)
            await db.flush()  # Assign primary key before setting values below
            # Re-query with joinedload so trainee_task.task is populated
            result2 = await db.execute(
                select(TraineeTask)
                .options(joinedload(TraineeTask.task))
                .where(and_(TraineeTask.trainee_id == trainee_id, TraineeTask.task_id == task_id))
            )
            trainee_task = result2.scalars().first()

        trainee_task.status = TaskStatus(status_val)
        trainee_task.notes = notes_val
            
        if status_val == "Completed":
            trainee_task.completion_date = date.today()
        else:
            trainee_task.completion_date = None

        # Normalize role to a plain string to guard against Enum vs string comparisons
        role_str = getattr(updated_by_role, "value", updated_by_role)
        if role_str == "admin":
            task_name = trainee_task.task.task_name if trainee_task.task else f"Task ID {task_id}"
            notification = Notification(
                trainee_id=trainee_id,
                title="Task Assignment Updated",
                message=f"The administrator has updated the status of your task '{task_name}' to '{status_val}'."
            )
            db.add(notification)

        await db.commit()
        await db.refresh(trainee_task)
        return trainee_task

    @staticmethod
    async def delete_trainee_task(db: AsyncSession, trainee_id: uuid.UUID, task_id: int) -> dict:
        result = await db.execute(
            select(TraineeTask)
            .options(joinedload(TraineeTask.task))
            .where(and_(TraineeTask.trainee_id == trainee_id, TraineeTask.task_id == task_id))
        )
        trainee_task = result.scalars().first()
        if not trainee_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Task assignment not found for this trainee."
            )
        
        task_name = trainee_task.task.task_name if trainee_task.task else f"Task ID {task_id}"
        
        notification = Notification(
            trainee_id=trainee_id,
            title="Task Assignment Removed",
            message=f"The task '{task_name}' has been unassigned from your profile by the administrator."
        )
        db.add(notification)
        
        await db.delete(trainee_task)
        await db.commit()
        return {"status": "success", "message": "Task assignment deleted successfully."}


    @staticmethod
    async def get_all_trainees(db: AsyncSession) -> List[Trainee]:
        result = await db.execute(
            select(Trainee)
            .options(joinedload(Trainee.trainee_tasks))
            .order_by(Trainee.trainee_name)
        )
        return list(result.scalars().unique().all())

    @staticmethod
    async def get_trainees_filtered(
        db: AsyncSession, 
        search: Optional[str] = None, 
        is_active: Optional[bool] = None
    ) -> List[Trainee]:
        query = select(Trainee)
        if search:
            query = query.where(Trainee.trainee_name.ilike(f"%{search}%"))
        if is_active is not None:
            query = query.where(Trainee.is_active == is_active)
        query = query.options(joinedload(Trainee.trainee_tasks)).order_by(Trainee.trainee_name)
        
        result = await db.execute(query)
        return list(result.scalars().unique().all())

    @staticmethod
    async def get_trainee_by_id(db: AsyncSession, trainee_id: uuid.UUID) -> Optional[Trainee]:
        result = await db.execute(
            select(Trainee)
            .options(joinedload(Trainee.trainee_tasks).joinedload(TraineeTask.task))
            .where(Trainee.id == trainee_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_tasks(db: AsyncSession) -> List[Task]:
        result = await db.execute(select(Task).order_by(Task.id))
        return list(result.scalars().all())

    @staticmethod
    async def create_task(db: AsyncSession, task_in: TaskCreate) -> Task:
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
        
        # Auto-create trainee_task rows for ALL existing trainees with status 'Not Started'
        trainees_result = await db.execute(select(Trainee))
        trainees = trainees_result.scalars().all()
        for trainee in trainees:
            trainee_task = TraineeTask(
                trainee_id=trainee.id,
                task_id=new_task.id,
                status=TaskStatus.NOT_STARTED
            )
            db.add(trainee_task)
            
            # Create a notification for the trainee
            notification = Notification(
                trainee_id=trainee.id,
                title="New Task Assigned!",
                message=f"A new task '{new_task.task_name}' has been assigned to you."
            )
            db.add(notification)
            
        await db.commit()
        await db.refresh(new_task)
        return new_task

    @staticmethod
    async def get_notifications(db: AsyncSession, trainee_id: uuid.UUID) -> List[Notification]:
        result = await db.execute(
            select(Notification)
            .where(Notification.trainee_id == trainee_id)
            .order_by(Notification.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def mark_notification_read(db: AsyncSession, notification_id: uuid.UUID, trainee_id: uuid.UUID) -> Notification:
        result = await db.execute(
            select(Notification).where(
                and_(Notification.id == notification_id, Notification.trainee_id == trainee_id)
            )
        )
        notification = result.scalars().first()
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        notification.is_read = True
        await db.commit()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def delete_task(db: AsyncSession, task_id: int) -> dict:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalars().first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )

        # Use a direct SQL DELETE so the DB-level ON DELETE CASCADE on trainee_tasks
        # handles child row removal without needing ORM-level eager loading.
        from sqlalchemy import delete as sql_delete
        await db.execute(sql_delete(TraineeTask).where(TraineeTask.task_id == task_id))
        await db.execute(sql_delete(Task).where(Task.id == task_id))
        await db.commit()
        return {"status": "success", "message": "Task deleted successfully."}

    @staticmethod
    async def get_task_progress(db: AsyncSession, task_id: int) -> List[Dict[str, Any]]:
        query = (
            select(Trainee.trainee_name, TraineeTask.status, TraineeTask.completion_date)
            .join(TraineeTask, Trainee.id == TraineeTask.trainee_id)
            .where(TraineeTask.task_id == task_id)
            .order_by(Trainee.trainee_name)
        )
        result = await db.execute(query)
        progress_list = []
        for row in result.all():
            progress_list.append({
                "trainee_name": row.trainee_name,
                "status": row.status.value if hasattr(row.status, "value") else row.status,
                "completion_date": row.completion_date
            })
        return progress_list

    # --- Analytics & Reporting Methods ---

    @staticmethod
    async def get_dashboard_summary(db: AsyncSession) -> Dict[str, Any]:
        trainees_res = await db.execute(select(Trainee).where(Trainee.role == UserRole.TRAINEE))
        trainees = trainees_res.scalars().all()
        total_trainees = len(trainees)
        
        tasks_res = await db.execute(select(Task))
        tasks = tasks_res.scalars().all()
        total_tasks = len(tasks)
        
        trainee_ids = [s.id for s in trainees]
        if not trainee_ids:
            return {
                "total_students": 0,  # Legacy field
                "total_trainees": 0,
                "total_tasks": total_tasks,
                "total_assignments": 0,
                "total_completed": 0,
                "total_in_progress": 0,
                "total_not_started": 0,
                "total_does_not_apply": 0,
                "overall_completion_rate": 0.0
            }
            
        st_res = await db.execute(select(TraineeTask).where(TraineeTask.trainee_id.in_(trainee_ids)))
        st_list = st_res.scalars().all()
        
        total_assignments = len(st_list)
        total_completed = sum(1 for st in st_list if st.status == TaskStatus.COMPLETED)
        total_in_progress = sum(1 for st in st_list if st.status == TaskStatus.IN_PROGRESS)
        total_not_started = sum(1 for st in st_list if st.status == TaskStatus.NOT_STARTED)
        total_does_not_apply = sum(1 for st in st_list if st.status == TaskStatus.DOES_NOT_APPLY)
        
        denominator = total_assignments - total_does_not_apply
        overall_completion_rate = (total_completed / denominator * 100) if denominator > 0 else 0.0
        
        return {
            "total_students": total_trainees,  # Legacy matching field
            "total_trainees": total_trainees,
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
        # Map student-wise endpoints to return trainee progress data
        result = await db.execute(
            select(Trainee)
            .options(joinedload(Trainee.trainee_tasks))
            .where(Trainee.role == UserRole.TRAINEE)
        )
        trainees = result.scalars().unique().all()
        
        summaries = []
        for trainee in trainees:
            tasks = trainee.trainee_tasks
            completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
            in_progress = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
            not_started = sum(1 for t in tasks if t.status == TaskStatus.NOT_STARTED)
            does_not_apply = sum(1 for t in tasks if t.status == TaskStatus.DOES_NOT_APPLY)
            total = len(tasks)
            
            denominator = total - does_not_apply
            overall_progress = (completed / denominator * 100) if denominator > 0 else 0.0
            
            summaries.append({
                "student_name": trainee.trainee_name,  # Legacy field mapping
                "trainee_name": trainee.trainee_name,
                "completed": completed,
                "in_progress": in_progress,
                "not_started": not_started,
                "does_not_apply": does_not_apply,
                "overall_progress": round(overall_progress, 1)
            })
            
        summaries.sort(key=lambda x: x["overall_progress"], reverse=True)
        return summaries

    @staticmethod
    async def get_task_wise_summary(db: AsyncSession) -> List[Dict[str, Any]]:
        result = await db.execute(
            select(Task)
            .options(joinedload(Task.trainee_tasks))
            .order_by(Task.id)
        )
        tasks = result.scalars().unique().all()
        
        summaries = []
        for task in tasks:
            st_list = task.trainee_tasks
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
        task_summaries = await TraineeService.get_task_wise_summary(db)
        
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
        tasks_res = await db.execute(select(Task).order_by(Task.id))
        tasks = tasks_res.scalars().all()
        task_names = [t.task_name for t in tasks]
        
        trainees_res = await db.execute(
            select(Trainee)
            .options(joinedload(Trainee.trainee_tasks))
            .where(Trainee.role == UserRole.TRAINEE)
            .order_by(Trainee.trainee_name)
        )
        trainees = trainees_res.scalars().unique().all()
        
        grid_students = []
        for trainee in trainees:
            st_map = {st.task_id: st.status.value if hasattr(st.status, "value") else st.status for st in trainee.trainee_tasks}
            statuses = []
            for task in tasks:
                statuses.append(st_map.get(task.id, "Not Started"))
                
            grid_students.append({
                "student_name": trainee.trainee_name,  # Legacy field mapping
                "trainee_name": trainee.trainee_name,
                "statuses": statuses
            })
            
        return {
            "tasks": task_names,
            "students": grid_students
        }
