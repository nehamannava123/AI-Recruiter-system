from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, LargeBinary, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "candidate" or "recruiter"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("Job", back_populates="recruiter")
    applications = relationship("Application", back_populates="candidate")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recruiter = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)
    resume_text = Column(Text)
    resume_skills = Column(Text)  # JSON-encoded list

    embedding = Column(LargeBinary)  # float32 numpy bytes, kept for future semantic re-ranking

    match_score = Column(Float)
    required_skills = Column(Text)  # JSON-encoded list
    matched_skills = Column(Text)  # JSON-encoded list
    missing_skills = Column(Text)  # JSON-encoded list

    # Recruiter workflow status
    status = Column(String, default="applied")  # applied | shortlisted | rejected

    # AI resume feedback (JSON-encoded list of feedback strings)
    ai_feedback = Column(Text)

    # Aptitude + coding screening round (must be completed before the AI video interview)
    screening_category = Column(String)
    aptitude_questions = Column(Text)  # JSON-encoded list of {id, question, options, answer_index}
    aptitude_results = Column(Text)  # JSON-encoded list of per-question results
    aptitude_total = Column(Integer, default=0)
    aptitude_correct = Column(Integer, default=0)
    aptitude_wrong = Column(Integer, default=0)
    aptitude_unanswered = Column(Integer, default=0)
    aptitude_score = Column(Float)  # percentage, 0-100
    coding_questions = Column(Text)  # JSON-encoded list of {id, title, prompt}
    coding_answers = Column(Text)  # JSON-encoded list of {question_id, title, prompt, answer}
    screening_completed = Column(Integer, default=0)  # 0/1 boolean

    # AI video interview
    interview_questions = Column(Text)  # JSON-encoded list of {id, question, skill}
    interview_answers = Column(Text)  # JSON-encoded list of {question_id, answer, result}
    interview_total = Column(Integer, default=0)
    interview_correct = Column(Integer, default=0)
    interview_wrong = Column(Integer, default=0)
    interview_unanswered = Column(Integer, default=0)
    interview_score = Column(Float)  # percentage, 0-100
    interview_completed = Column(Integer, default=0)  # 0/1 boolean
    interview_video_path = Column(String)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
