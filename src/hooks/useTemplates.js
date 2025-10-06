import { useEffect, useState } from "react";

const STORAGE_KEY = "syntellite:templates:v1";

const defaultTemplates = [
  {
    id: 1,
    name: "Offer v3",
    subject: "Congratulations {First_Name} - Offer from {Company_Name}",
    bodyText:
      "Dear {First_Name},\n\nWe are excited to extend an offer for the {Role} position.\nPlease review the attached details and let us know if you have any questions.\n\nRegards,\nTalent Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>We are excited to extend an offer for the {Role} position.</p><p>Please review the attached details and let us know if you have any questions.</p><p>Regards,<br/>Talent Team</p>',
  },
  {
    id: 2,
    name: "Rejection v2",
    subject: "Application Update - {Company_Name}",
    bodyText:
      "Dear {First_Name},\n\nThank you for applying for the {Role} position.\nAfter careful consideration we will not be moving forward at this time.\n\nRegards,\nTalent Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>Thank you for applying for the {Role} position.</p><p>After careful consideration we will not be moving forward at this time.</p><p>Regards,<br/>Talent Team</p>',
  },
  {
    id: 3,
    name: "Interview v1",
    subject: "Interview Schedule - {Company_Name}",
    bodyText:
      "Dear {First_Name},\n\nWe would like to invite you to interview for the {Role} position.\nPlease reply with your availability so we can confirm a slot.\n\nRegards,\nTalent Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>We would like to invite you to interview for the {Role} position.</p><p>Please reply with your availability so we can confirm a slot.</p><p>Regards,<br/>Talent Team</p>',
  },
];

export function useTemplates() {
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultTemplates;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch {}
  }, [templates]);

  const addOrUpdate = (template) => {
    setTemplates((prev) => {
      if (template.id && prev.some((item) => item.id === template.id)) {
        return prev.map((item) => (item.id === template.id ? template : item));
      }
      return [...prev, { ...template, id: Date.now() }];
    });
  };

  const remove = (id) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id));
  };

  return { templates, addOrUpdate, remove };
}
