from django.urls import path

from .views import CharacterChatView


urlpatterns = [
    path("", CharacterChatView.as_view(), name="character-chat"),
]
