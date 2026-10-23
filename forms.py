from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .models import UserProfile


class RegisterForm(forms.Form):

    full_name = forms.CharField(
        max_length=150,
        required=True
    )

    email = forms.EmailField(
        required=True
    )

    phone = forms.CharField(
        max_length=20,
        required=True
    )

    password = forms.CharField(
        min_length=8,
        widget=forms.PasswordInput,
        required=True
    )

    confirm_password = forms.CharField(
        min_length=8,
        widget=forms.PasswordInput,
        required=True
    )

    agree_terms = forms.BooleanField(
        required=True
    )

    def clean_email(self):
        email = self.cleaned_data["email"].lower().strip()

        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(
                "An account with this email already exists."
            )

        return email

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password:
            if password != confirm_password:
                raise forms.ValidationError(
                    "Passwords do not match."
                )

        return cleaned_data

    def save(self):
        full_name = self.cleaned_data["full_name"].strip()
        email = self.cleaned_data["email"]
        phone = self.cleaned_data["phone"]
        password = self.cleaned_data["password"]

        first_name = full_name
        last_name = ""

        if " " in full_name:
            parts = full_name.split()
            first_name = parts[0]
            last_name = " ".join(parts[1:])

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        UserProfile.objects.create(
            user=user,
            phone=phone
        )

        return user


class LoginForm(forms.Form):

    email = forms.EmailField(
        required=True
    )

    password = forms.CharField(
        widget=forms.PasswordInput,
        required=True
    )

    remember_me = forms.BooleanField(
        required=False
    )

    def clean(self):
        cleaned_data = super().clean()

        email = cleaned_data.get("email")
        password = cleaned_data.get("password")

        if email and password:

            email = email.lower().strip()

            user = User.objects.filter(
                email__iexact=email
            ).first()

            if not user:
                raise forms.ValidationError(
                    "Invalid email or password."
                )

            authenticated_user = authenticate(
                username=user.username,
                password=password
            )

            if authenticated_user is None:
                raise forms.ValidationError(
                    "Invalid email or password."
                )

            if not authenticated_user.is_active:
                raise forms.ValidationError(
                    "This account is inactive."
                )

            cleaned_data["user"] = authenticated_user

        return cleaned_data