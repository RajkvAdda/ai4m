import { connectToDatabase } from "@/lib/db";
import User from "@/modals/User";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          let loginUser = await User.findOne({ email: user.email });

          if (!loginUser) {
            console.log("rj-signin", { user, account, profile });

            loginUser = await User.create({
              id: user.id,
              name: user.name!,
              email: user.email!,
              avator: user.image,
              role: "user",
              password: "User@1234",
            });
          }

          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      console.log("rj-session", { session, token });
      if (session.user?.email) {
        const user = session.user;
        if (user) {
          (session.user as any).id = user.id;
          (session.user as any).role = user.role;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
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
