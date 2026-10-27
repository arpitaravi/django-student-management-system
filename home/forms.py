
from django import forms
from .models import Student


class StudentForm(forms.ModelForm):

    class Meta:
        model = Student
        fields = ["name", "email", "age"]

        widgets = {
            "name": forms.TextInput(attrs={
                "class": "form-control",
                "placeholder": "Enter student name"
            }),
            "email": forms.EmailInput(attrs={
                "class": "form-control",
                "placeholder": "Enter email address"
            }),
            "age": forms.NumberInput(attrs={
                "class": "form-control",
                "placeholder": "Enter age"
            }),
        }

    def clean_name(self):
        name = self.cleaned_data["name"]

        if not name.strip():
            raise forms.ValidationError(
                "Student name cannot be empty."
            )

        return name.strip()

    def clean_age(self):
        age = self.cleaned_data["age"]

        if age < 1 or age > 120:
            raise forms.ValidationError(
                "Age must be between 1 and 120."
            )

        return age

