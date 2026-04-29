from app.models import Session


class InMemorySessionStore:
    def __init__(self) -> None:
        self._store: dict[str, Session] = {}

    def create(self, session: Session) -> Session:
        self._store[session.id] = session
        return session

    def get(self, session_id: str) -> Session | None:
        return self._store.get(session_id)

    def save(self, session: Session) -> Session:
        self._store[session.id] = session
        return session
