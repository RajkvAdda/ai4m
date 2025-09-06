import { connectToDatabase } from "@/lib/db";
import User from "@/modals/User";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
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
