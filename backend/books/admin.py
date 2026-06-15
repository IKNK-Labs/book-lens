from django.contrib import admin

from .models import Book, BookContent


class BookContentInline(admin.StackedInline):
    model = BookContent
    extra = 0


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "author", "publisher", "isbn", "updated_at"]
    search_fields = ["title", "author", "isbn"]
    inlines = [BookContentInline]
