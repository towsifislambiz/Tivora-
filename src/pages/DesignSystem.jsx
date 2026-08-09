import React from 'react';
import { Layers, CheckCircle, Sparkles } from 'lucide-react';

export default function DesignSystem() {
  const colorSwatches = [
    { label: 'Primary', hex: '#6C5CE7', bg: 'bg-[#6C5CE7]' },
    { label: 'Violet', hex: '#8B5CF6', bg: 'bg-[#8B5CF6]' },
    { label: 'Pink', hex: '#EC4899', bg: 'bg-[#EC4899]' },
    { label: 'Blue', hex: '#3B82F6', bg: 'bg-[#3B82F6]' },
    { label: 'Cyan', hex: '#06B6D4', bg: 'bg-[#06B6D4]' },
    { label: 'Success', hex: '#10B981', bg: 'bg-[#10B981]' },
    { label: 'Lavender', hex: '#F0F3FF', bg: 'bg-[#F0F3FF]', darkText: true },
    { label: 'Background', hex: '#F7F8FF', bg: 'bg-[#F7F8FF]', darkText: true },
  ];

  return (
    <div class="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-soft-sm space-y-8">
      {/* Design System Header */}
      <div class="border-b border-brand-border pb-5">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-brand-mainText">Tivora</h1>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary-gradient text-white">
            DESIGN SYSTEM v1.0
          </span>
        </div>
        <p class="text-xs sm:text-sm text-brand-mutedText mt-1">
          Connect · Share · Grow Together — Centralized Token Specs & Components Showcase
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colors Palette Section */}
        <div class="space-y-3">
          <h3 class="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Colors Palette</h3>
          <div class="grid grid-cols-4 gap-2.5">
            {colorSwatches.map((color) => (
              <div key={color.label} class="flex flex-col items-center gap-1">
                <div class={`w-full h-12 rounded-xl ${color.bg} shadow-soft-sm flex items-center justify-center font-bold text-[0.65rem] ${color.darkText ? 'text-brand-mainText' : 'text-white'}`}>
                  {color.hex}
                </div>
                <span class="text-[0.68rem] text-brand-mutedText font-semibold">{color.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Section */}
        <div class="space-y-3">
          <h3 class="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Typography (Plus Jakarta Sans)</h3>
          <div class="bg-brand-lavender p-4 rounded-2xl space-y-2 text-xs">
            <div class="flex items-baseline justify-between">
              <span class="text-brand-mutedText font-semibold w-24">Bold 700</span>
              <span class="font-bold text-base text-brand-mainText">Heading Title</span>
            </div>
            <div class="flex items-baseline justify-between">
              <span class="text-brand-mutedText font-semibold w-24">SemiBold 600</span>
              <span class="font-semibold text-sm text-brand-mainText">Subheading Text</span>
            </div>
            <div class="flex items-baseline justify-between">
              <span class="text-brand-mutedText font-semibold w-24">Regular 400</span>
              <span class="font-normal text-xs text-brand-mainText">Body Paragraph</span>
            </div>
          </div>
        </div>

        {/* Buttons Showcase */}
        <div class="space-y-3">
          <h3 class="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Buttons</h3>
          <div class="flex flex-wrap gap-2.5">
            <button class="px-4 py-2 rounded-full bg-primary-gradient text-white font-semibold text-xs shadow-gradient-glow">
              Primary Button
            </button>
            <button class="px-4 py-2 rounded-full bg-white border border-brand-border text-brand-mainText font-semibold text-xs shadow-soft-sm">
              Secondary Button
            </button>
            <button class="px-4 py-2 rounded-full border border-brand-purple text-brand-purple font-semibold text-xs">
              Outline
            </button>
            <button class="px-4 py-2 rounded-full text-brand-mutedText font-semibold text-xs hover:bg-brand-lavender">
              Ghost
            </button>
          </div>
        </div>

        {/* Badges Showcase */}
        <div class="space-y-3">
          <h3 class="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Badges</h3>
          <div class="flex flex-wrap gap-2">
            <span class="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-purple/15 text-brand-purple">Admin</span>
            <span class="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-cyan/15 text-brand-cyan">Moderator</span>
            <span class="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-blue/15 text-brand-blue">Member</span>
            <span class="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-success/15 text-brand-success">Online</span>
            <span class="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-pink/15 text-brand-pink">New</span>
          </div>
        </div>
      </div>

      {/* Breakpoint Diagram */}
      <div class="space-y-3">
        <h3 class="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Responsive Breakpoints</h3>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-lavender p-4 rounded-2xl text-center text-xs text-brand-mutedText">
          <div class="bg-white p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Mobile<br/><span class="text-[0.65rem] text-brand-mutedText font-normal">320px - 479px</span></div>
          <div class="bg-white p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Tablet<br/><span class="text-[0.65rem] text-brand-mutedText font-normal">768px - 1023px</span></div>
          <div class="bg-white p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Laptop<br/><span class="text-[0.65rem] text-brand-mutedText font-normal">1024px - 1279px</span></div>
          <div class="bg-white p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Desktop<br/><span class="text-[0.65rem] text-brand-mutedText font-normal">1280px+</span></div>
        </div>
      </div>

      {/* Banner Showcase */}
      <div class="bg-banner-gradient rounded-3xl p-6 sm:p-8 flex items-center justify-between border border-brand-pink/20">
        <div>
          <h3 class="text-xl font-bold text-brand-purple">Community First Design</h3>
          <p class="text-xs text-brand-mutedText mt-1">Light mode UI with soft lavender surfaces, electric purple, violet, and hot pink accents.</p>
        </div>
        <Sparkles class="w-10 h-10 text-brand-pink fill-brand-pink/20 shrink-0" />
      </div>
    </div>
  );
}
