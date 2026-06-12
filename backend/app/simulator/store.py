from app.simulator.schemas import ChatSession


class InMemorySessionStore:
    def __init__(self) -> None:
        self._store: dict[str, ChatSession] = {}

    def create(self, session: ChatSession) -> ChatSession:
        self._store[session.id] = session
        return session

    def get(self, session_id: str) -> ChatSession | None:
        return self._store.get(session_id)

    def save(self, session: ChatSession) -> ChatSession:
        self._store[session.id] = session
        return session
