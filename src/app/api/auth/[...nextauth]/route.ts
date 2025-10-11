import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Gunakan service_role key untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Ganti dengan service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const { data: existingUser, error: selectError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", user.email)
            .maybeSingle(); // Gunakan maybeSingle() instead of single()

          if (selectError && selectError.code !== "PGRST116") {
            console.error("Error checking user:", selectError);
            return false;
          }

          if (!existingUser) {
            // Create new user
            const { data: newUser, error: insertError } = await supabaseAdmin
              .from("users")
              .insert({
                email: user.email,
                name: user.name,
                image: user.image,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error creating user:", insertError);
              return false;
            }

            if (newUser) {
              user.id = newUser.id;
            }
          } else {
            user.id = existingUser.id;
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Get user from Supabase using email
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .maybeSingle();

        if (dbUser) {
          session.user.id = dbUser.id;
        } else if (token.id) {
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
