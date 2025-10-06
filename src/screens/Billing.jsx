import React from "react";
import Section from "../components/Section";

const plans = [
  { name: "Free", price: "Rs 0", sub: "50 emails / month", cta: "Current Plan" },
  { name: "Startup", price: "Rs 999", sub: "1,000 emails + AI writing", cta: "Upgrade" },
  { name: "Pro", price: "Rs 3,999", sub: "10,000 emails + analytics + scheduling", cta: "Upgrade" },
];

function ScreenBilling() {
  return (
    <div className="grid gap-6">
      <Section title="Plans">
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-2xl border p-5">
              <div className="text-sm text-gray-500">{plan.name}</div>
              <div className="text-3xl font-semibold mt-1">
                {plan.price}
                <span className="text-sm text-gray-500">/mo</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">{plan.sub}</div>
              <button
                className={`mt-4 px-3 py-2 rounded-xl text-sm border ${
                  plan.name === "Free" ? "" : "bg-gray-900 text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Billing History">
        <div className="text-sm text-gray-500">No invoices yet.</div>
      </Section>
    </div>
  );
}

export default ScreenBilling;
