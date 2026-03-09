from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"message": "Accounts app working"})