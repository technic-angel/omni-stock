/**
 * Auth Schemas - Zod Validation
 *
 * 📚 PAIR PROGRAMMING SESSION
 *
 * We'll build these schemas step by step to understand:
 * 1. What Zod is and why we use it
 * 2. How to define validation rules
 * 3. How to generate TypeScript types
 * 4. How to connect it to forms
 */

import { z } from 'zod'

// ============================================
// STEP 1: What is Zod?
// ============================================
//
// Zod is a "schema declaration and validation library"
//
// Problem it solves:
// - TypeScript only checks types at BUILD TIME
// - User input (forms, API responses) is checked at RUN TIME
// - Without Zod, you'd write manual validation like:
//
//   if (!username || username.length < 1) {
//     setError('Username is required')
//   }
//   if (!password || password.length < 8) {
//     setError('Password must be 8 chars')
//   }
//
// With Zod, you declare rules ONCE and get:
// - Runtime validation
// - TypeScript types
// - Error messages
// - Works with react-hook-form

// ============================================
// STEP 2: Basic Zod Syntax
// ============================================
//
// z.string()           → must be a string
// z.number()           → must be a number
// z.boolean()          → must be true/false
// z.object({...})      → must be an object with these fields
//
// Chaining methods (validators):
// .min(n, 'error')     → minimum length/value
// .max(n, 'error')     → maximum length/value
// .email('error')      → must be valid email format
// .optional()          → field can be undefined
// .nullable()          → field can be null

// ============================================
// STEP 3: Let's Build the Login Schema
// ============================================

export const loginSchema = z.object({
  // Username: required, minimum 3 characters
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),

  // Password: required, minimum 8 characters
  // For login, we don't enforce complexity (user already set it during registration)
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

// ============================================
// STEP 4: Generate TypeScript Type
// ============================================
//
// z.infer extracts the TypeScript type from the schema
// This keeps your type and validation IN SYNC automatically!

export type LoginInput = z.infer<typeof loginSchema>
// This creates: { username: string; password: string }

// ============================================
// STEP 5: Register Schema - With Password Complexity!
// ============================================
//
// 📚 ADVANCED VALIDATION:
//
// .regex(pattern, message) - Must match a regex pattern
// .refine(fn, options)     - Custom validation function
//
// For confirmPassword, we need to compare two fields.
// This requires .refine() on the WHOLE object (not just one field)

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(5, 'Username must be at least 5 characters')
      .max(30, 'Username must be less than 30 characters'),

    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),

    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      // Requires at least one number (0-9)
      .regex(/\d/, 'Password must contain at least one number')
      // Requires at least one special character
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character (!@#$%^&*)',
      ),

    confirmPassword: z.string().min(1, 'Please confirm your password'),
    company_name: z
      .string()
      .max(255, 'Company name must be less than 255 characters')
      .optional()
      .or(z.literal('')),
    birthdate: z
      .string()
      .min(1, 'Birthdate is required')
      .refine((value) => {
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) {
          return false
        }
        const today = new Date()
        if (parsed > today) {
          return false
        }
        const currentYearBirthday = new Date(
          today.getFullYear(),
          parsed.getMonth(),
          parsed.getDate(),
        )
        const ageYears =
          today.getFullYear() - parsed.getFullYear() - (today < currentYearBirthday ? 1 : 0)
        return ageYears >= 18
      }, 'You must be at least 18 years old.')
  })
  // 📚 .refine() on the object compares two fields
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // Show error on this field
  })

export type RegisterInput = z.infer<typeof registerSchema>
