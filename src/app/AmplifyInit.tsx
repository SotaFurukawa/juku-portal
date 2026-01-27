"use client";
import { configureAmplify } from "@/lib/amplifyClient";

export default function AmplifyInit() {
  configureAmplify();
  return null;
}
