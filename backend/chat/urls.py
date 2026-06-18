from django.urls import path

from .views import ChatView, GreetingView

urlpatterns = [
    path("", ChatView.as_view(), name="chat"),
    path("greeting", GreetingView.as_view(), name="chat-greeting"),
]
