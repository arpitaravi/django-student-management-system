from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import UserCreationForm
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .forms import StudentForm
from .models import Student
from .serializers import StudentSerializer



def admin_required(user):
    return user.is_authenticated and user.is_staff


@login_required
def student_list(request):
    query = request.GET.get("q", "")
    students = Student.objects.all()

    if query:
        students = students.filter(name__icontains=query) | students.filter(
            email__icontains=query
        )

    paginator = Paginator(students, 10)
    page_obj = paginator.get_page(request.GET.get("page"))

    return render(
        request,
        "home/student_list.html",
        {"students": page_obj, "page_obj": page_obj, "query": query},
    )


@user_passes_test(admin_required)
def student_create(request):
    if request.method == "POST":
        form = StudentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("student_list")
    else:
        form = StudentForm()
    return render(request, "home/student_form.html", {"form": form})


@user_passes_test(admin_required)
def student_update(request, pk):
    student = get_object_or_404(Student, pk=pk)
    if request.method == "POST":
        form = StudentForm(request.POST, instance=student)
        if form.is_valid():
            form.save()
            return redirect("student_list")
    else:
        form = StudentForm(instance=student)
    return render(request, "home/student_form.html", {"form": form})


@user_passes_test(admin_required)
def student_delete(request, pk):
    student = get_object_or_404(Student, pk=pk)
    if request.method == "POST":
        student.delete()
        return redirect("student_list")
    return render(
        request, "home/student_confirm_delete.html", {"student": student}
    )


def user_login(request):
    selected_role = "user"

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        selected_role = request.POST.get("role", "user")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            # Admin login: staff permission irukkanum
            if selected_role == "admin" and user.is_staff:
                login(request, user)
                return redirect("admin_dashboard")

            # User login: normal user-a irukkanum
            elif selected_role == "user" and not user.is_staff:
                login(request, user)
                return redirect("user_dashboard")

            else:
                messages.error(
                    request,
                    "Invalid username/password or incorrect login type."
                )
        else:
            messages.error(request, "Invalid username or password")

    return render(request, "home/login.html")



def user_logout(request):
    logout(request)
    return redirect("login")


def register(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()  # Newly registered users are not staff by default.
            return redirect("login")
    else:
        form = UserCreationForm()
    return render(request, "home/register.html", {"form": form})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def student_api(request):
    if request.method == "GET":
        serializer = StudentSerializer(Student.objects.all(), many=True)
        return Response(serializer.data)

    serializer = StudentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def student_detail_api(request, pk):
    student = get_object_or_404(Student, pk=pk)
    if request.method == "GET":
        return Response(StudentSerializer(student).data)

    if request.method == "PUT":
        serializer = StudentSerializer(student, data=request.data)
    elif request.method == "PATCH":
        serializer = StudentSerializer(student, data=request.data, partial=True)
    else:  # DELETE
        student.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@login_required
def admin_dashboard(request):
    if not request.user.is_staff:
        return redirect("user_dashboard")
    return render(
        request,
        "home/admin_dashboard.html",
        {"total_students": Student.objects.count()},
    )


@login_required
def user_dashboard(request):
    if request.user.is_staff:
        return redirect("admin_dashboard")
    return render(request, "home/user_dashboard.html")
def forgot_password_page(request):
    return render(request, "home/forgot_password.html")
