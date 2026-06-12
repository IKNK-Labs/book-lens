from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def root(request):
    return JsonResponse(
        {
            "service": "book-lens-api",
            "status": "ok",
            "endpoints": {
                "health": "/api/health/",
            },
        }
    )


@require_GET
def health(request):
    return JsonResponse({"status": "ok"})
