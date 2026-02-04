"use client";

import { useEffect, useState, Suspense, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PasswordStrength } from "@/components/profile/password-strength";
import { Save, ArrowLeft, Shield, Mail, User, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { IUser, userZodSchema } from "@/types/user";

export const ROLES = ["SPP", "GST", "User", "Intern"];

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  // Resolve async params
  const { id } = use(params);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<IUser & { confirmPassword: string }>({
    resolver: zodResolver(userZodSchema),
  });

  const watchedName = watch("name") || "";
  const watchedRole = watch("role");

  // Check if password fields have been modified
  const hasPasswordChanges =
    isChangingPassword &&
    (currentPassword || newPassword || confirmNewPassword);

  // Fetch user data when id is available
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData: IUser = await res.json();
        setUser(userData);
        // Set form default values after fetching user data
        reset({
          ...userData,
          confirmPassword: userData.password, // Initialize confirmPassword
        });
      } catch {
        setFetchError("Failed to load user data. Please try again.");
      }
    };

    if (id && !user) {
      fetchUser();
    }
  }, [id, user, reset]);

  // Handle form submission
  const onSubmit = async (data: IUser & { confirmPassword: string }) => {
    setIsLoading(true);
    setPasswordError("");

    try {
      const updateData: Record<string, string> = {
        name: data.name,
        avator: data.avator,
        role: data.role,
      };

      // Handle password change if user is changing it
      if (isChangingPassword) {
        if (!currentPassword) {
          setPasswordError("Current password is required");
          setIsLoading(false);
          return;
        }
        if (!newPassword || newPassword.length < 6) {
          setPasswordError("New password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPasswordError("New passwords do not match");
          setIsLoading(false);
          return;
        }

        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      console.log("Profile updated:", data);
      router.back();
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.";
      setFetchError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  console.log("first user", user);
  // Show loading state while fetching user data
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
        <span className="text-lg font-semibold">Loading...</span>
        {fetchError && <p className="text-red-500 mt-2">{fetchError}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your personal information and settings
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Section */}
          <Card className="border-0 shadow-md">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>
                Upload a photo or provide a URL for your profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarUpload
                currentAvatar={user.avator}
                userName={watchedName}
                onAvatarChange={(avatar) =>
                  setValue("avator", avatar, { shouldDirty: true })
                }
              />
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter your full name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Enter your email"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </Label>
                <Select
                  value={watchedRole}
                  disabled
                  onValueChange={(value) => {
                    setValue("role", value, { shouldDirty: true });
                  }}
                >
                  <SelectTrigger
                    className={errors.role ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="changePassword"
                  className="text-base font-medium"
                >
                  Change Password
                </Label>
                <Button
                  type="button"
                  variant={isChangingPassword ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsChangingPassword(!isChangingPassword);
                    setPasswordError("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                >
                  {isChangingPassword ? "Cancel" : "Change Password"}
                </Button>
              </div>

              {isChangingPassword && (
                <>
                  {passwordError && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                      {passwordError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <PasswordStrength password={newPassword} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmNewPassword">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <Button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  variant="destructive"
                  className="sm:w-auto w-full order-3 sm:order-none"
                >
                  Logout
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(isDirty || hasPasswordChanges) && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      You have unsaved changes
                    </>
                  )}
                </div>

                <div className="flex gap-3 sm:flex-row flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="sm:w-auto w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || (!isDirty && !hasPasswordChanges)}
                    className="sm:w-auto w-full flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
      {fetchError && (
        <p className="text-red-500 text-center mt-4">{fetchError}</p>
      )}
    </div>
  );
}

// Wrap the component in Suspense for async params handling
export function EditProfilePageWrapper(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
          <span className="text-lg font-semibold">Loading...</span>
        </div>
      }
    >
      <EditProfilePage {...props} />
    </Suspense>
  );
}
