import { connectToDatabase } from "@/lib/db";
import User from "@/modals/User";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await connectToDatabase();
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avator,
          };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          let loginUser = await User.findOne({ email: user.email });

          if (!loginUser) {
            const hashedPassword = await bcrypt.hash("User@1234", 10);
            loginUser = await User.create({
              id: user.id,
              name: user.name!,
              email: user.email!,
              avator: user.image,
              role: "User",
              password: hashedPassword,
            });
          }

          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      if (account?.provider === "credentials") {
        return true;
      }
      return true;
    },
    async signOut({ token, session }) {
      try {
        // Clear the session
        if (session) {
          session.user = null;
          session.expires = null;
        }

        // Invalidate the token
        if (token) {
          token = {};
        }

        return true;
      } catch (error) {
        console.error("Error during sign out:", error);
        return false;
      }
    },
    async session({ session, token }: { session: any; token: any }) {
      let loginUser = await User.findOne({ email: session.user.email });

      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = loginUser?.name || session.user.name;
        session.user.avatar = loginUser?.avator;
        session.user.image = loginUser?.avator || session.user.image;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
