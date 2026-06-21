from django.urls import path

from .views import (
    ChatSessionDetailView,
    ChatSessionListCreateView,
    ChatSessionMessagesView,
    ChatView,
    ConversationFeedbackView,
    GreetingView,
)

urlpatterns = [
    path("", ChatView.as_view(), name="chat"),
    path("feedback", ConversationFeedbackView.as_view(), name="chat-feedback"),
    path("greeting", GreetingView.as_view(), name="chat-greeting"),
    path("sessions", ChatSessionListCreateView.as_view(), name="chat-sessions"),
    path(
        "sessions/<uuid:session_id>",
        ChatSessionDetailView.as_view(),
        name="chat-session-detail",
    ),
    path(
        "sessions/<uuid:session_id>/messages",
        ChatSessionMessagesView.as_view(),
        name="chat-session-messages",
    ),
]
