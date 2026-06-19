from django.urls import path

from .views import ChatView, ConversationFeedbackView, GreetingView

urlpatterns = [
    path("", ChatView.as_view(), name="chat"),
    path("feedback", ConversationFeedbackView.as_view(), name="chat-feedback"),
    path("greeting", GreetingView.as_view(), name="chat-greeting"),
]
