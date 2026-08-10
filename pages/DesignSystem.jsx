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
    <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 border border-brand-border shadow-soft-sm space-y-8">
      {/* Design System Header */}
      <div className="border-b border-brand-border pb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-brand-mainText">Tivora</h1>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-gradient text-white">
            DESIGN SYSTEM v1.0
          </span>
        </div>
        <p className="text-xs sm:text-sm text-brand-mutedText mt-1">
          Connect · Share · Grow Together — Centralized Token Specs & Components Showcase
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colors Palette Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Colors Palette</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {colorSwatches.map((color) => (
              <div key={color.label} className="flex flex-col items-center gap-1">
                <div className={`w-full h-12 rounded-xl ${color.bg} shadow-soft-sm flex items-center justify-center font-bold text-[0.65rem] ${color.darkText ? 'text-brand-mainText' : 'text-white'}`}>
                  {color.hex}
                </div>
                <span className="text-[0.68rem] text-brand-mutedText font-semibold">{color.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Typography (Plus Jakarta Sans)</h3>
          <div className="bg-brand-lavender p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="text-brand-mutedText font-semibold w-24">Bold 700</span>
              <span className="font-bold text-base text-brand-mainText">Heading Title</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-brand-mutedText font-semibold w-24">SemiBold 600</span>
              <span className="font-semibold text-sm text-brand-mainText">Subheading Text</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-brand-mutedText font-semibold w-24">Regular 400</span>
              <span className="font-normal text-xs text-brand-mainText">Body Paragraph</span>
            </div>
          </div>
        </div>

        {/* Buttons Showcase */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Buttons</h3>
          <div className="flex flex-wrap gap-2.5">
            <button className="px-4 py-2 rounded-full bg-primary-gradient text-white font-semibold text-xs shadow-gradient-glow">
              Primary Button
            </button>
            <button className="px-4 py-2 rounded-full bg-brand-surface border border-brand-border text-brand-mainText font-semibold text-xs shadow-soft-sm">
              Secondary Button
            </button>
            <button className="px-4 py-2 rounded-full border border-brand-purple text-brand-purple font-semibold text-xs">
              Outline
            </button>
            <button className="px-4 py-2 rounded-full text-brand-mutedText font-semibold text-xs hover:bg-brand-lavender">
              Ghost
            </button>
          </div>
        </div>

        {/* Badges Showcase */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Badges</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-purple/15 text-brand-purple">Admin</span>
            <span className="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-cyan/15 text-brand-cyan">Moderator</span>
            <span className="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-blue/15 text-brand-blue">Member</span>
            <span className="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-success/15 text-brand-success">Online</span>
            <span className="px-3 py-1 rounded-full text-[0.68rem] font-bold uppercase bg-brand-pink/15 text-brand-pink">New</span>
          </div>
        </div>
      </div>

      {/* Breakpoint Diagram */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-brand-mainText border-b border-brand-border pb-2">Responsive Breakpoints</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-lavender p-4 rounded-2xl text-center text-xs text-brand-mutedText">
          <div className="bg-brand-surface p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Mobile<br/><span className="text-[0.65rem] text-brand-mutedText font-normal">320px - 479px</span></div>
          <div className="bg-brand-surface p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Tablet<br/><span className="text-[0.65rem] text-brand-mutedText font-normal">768px - 1023px</span></div>
          <div className="bg-brand-surface p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Laptop<br/><span className="text-[0.65rem] text-brand-mutedText font-normal">1024px - 1279px</span></div>
          <div className="bg-brand-surface p-3 rounded-xl shadow-soft-sm font-semibold text-brand-purple">Desktop<br/><span className="text-[0.65rem] text-brand-mutedText font-normal">1280px+</span></div>
        </div>
      </div>

      {/* Banner Showcase */}
      <div className="bg-banner-gradient rounded-3xl p-6 sm:p-8 flex items-center justify-between border border-brand-pink/20">
        <div>
          <h3 className="text-xl font-bold text-brand-purple">Community First Design</h3>
          <p className="text-xs text-brand-mutedText mt-1">Light mode UI with soft lavender surfaces, electric purple, violet, and hot pink accents.</p>
        </div>
        <Sparkles className="w-10 h-10 text-brand-pink fill-brand-pink/20 shrink-0" />
      </div>
    </div>
  );
}
