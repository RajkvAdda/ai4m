"use client";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong",
  ];
  const strengthColors = [
    "bg-red-500",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-500",
  ];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? strengthColors[strength - 1] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs transition-colors ${
          strength < 3
            ? "text-red-600"
            : strength < 5
            ? "text-yellow-600"
            : "text-green-600"
        }`}
      >
        Password strength: {strengthLabels[strength - 1] || "Very Weak"}
      </p>
    </div>
  );
}
