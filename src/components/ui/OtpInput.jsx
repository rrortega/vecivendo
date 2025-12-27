import React, { useRef, useEffect } from 'react';
import { Input } from "@/components/ui/Input";

export function OtpInput({ value = "", onChange, length = 6, className = "" }) {
    const inputs = useRef([]);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        // Handle Paste or multiple chars
        if (val.length > 1) {
            const pastedData = val.slice(0, length).split('');
            let newValue = value.split('');

            pastedData.forEach((char, i) => {
                if (index + i < length) {
                    newValue[index + i] = char;
                }
            });

            const finalStr = newValue.join("").slice(0, length);
            onChange(finalStr);

            // Focus the last input that was filled or the next code
            const nextIndex = Math.min(index + val.length, length - 1);
            inputs.current[nextIndex]?.focus();
            return;
        }

        // Handle Single Char
        const newValue = value.split('');
        // If value is shorter than length, pad it? No, just use index.
        // We need to construct the string based on index.
        // Actually, working with a string is harder for random access if it's short.
        // Let's assume value is always length-sized or we pad it on the fly?
        // Better: Pad with spaces or empty chars for internal logic?

        // Let's reconstruct the array
        const newArray = Array(length).fill("").map((_, i) => value[i] || "");
        newArray[index] = val;

        const finalStr = newArray.join("").slice(0, length);
        onChange(finalStr);

        // Auto focus next
        if (val && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // Moving back
                inputs.current[index - 1]?.focus();
                // Optionally delete the prev char too? 
                // Standard behavior: if empty, move back. If not empty, delete (handled by onChange).
                // But since we are using controlled inputs, onChange handles deletion.
                // If I hit backspace on an empty field, I want to move back.
            } else if (value[index]) {
                // allow default backspace to fire onChange with empty
            }
        }
    };

    // Helper to get digit at index safely
    const getDigit = (i) => (value && value[i]) ? value[i] : "";

    return (
        <div className={`flex justify-center gap-2 ${className}`}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={el => inputs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={6} // Allow paste
                    value={getDigit(index)}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-10 h-12 text-center text-xl font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );
}
