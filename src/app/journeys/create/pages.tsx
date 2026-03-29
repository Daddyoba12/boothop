"use client";

import { useState } from "react";

export default function CreateJourney() {
  const [form, setForm] = useState({
    from: "",
    to: "",
    departure: "",
    arrival: "",
    weight: "",
    price: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/journeys/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      alert("Journey successfully created 🚀");
    } else {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-6">
        Add Your Travel Journey
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          placeholder="From City"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, from: e.target.value })}
          required
        />

        <input
          placeholder="To City"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, to: e.target.value })}
          required
        />

        <input
          type="date"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, departure: e.target.value })}
          required
        />

        <input
          type="date"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, arrival: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Available Weight (kg)"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Price per kg (£)"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        <textarea
          placeholder="Extra Information"
          className="w-full border p-3 rounded-xl"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          {loading ? "Submitting..." : "Publish Journey"}
        </button>

      </form>
    </div>
  );
}