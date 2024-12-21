import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { client } from './apollo-client';
import { LOGIN_QUERY } from '@/graphql/mutations/login';
import type { LoginQueryResponse, LoginQueryVariables } from '../graphql/mutations/login';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { data } = await client.query<LoginQueryResponse, LoginQueryVariables>({
            query: LOGIN_QUERY,
            variables: {
              email: credentials?.email || '',
              password: credentials?.password || '',
            },
          });

          if (data?.getAccountByID) {
            // Return user data for the session
            return {
              id: data.getAccountByID.id,
              name: data.getAccountByID.name,
              email: data.getAccountByID.email,
            };
          }
          return null;
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Set maximum session age to 7 days (in seconds)
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    // Set maximum token age to 7 days (in seconds)
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};