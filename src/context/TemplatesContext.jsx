import React, { createContext, useContext, useState } from "react";

const TemplatesContext = createContext();

const defaultTemplates = [
  {
    id: 1,
    name: "Offer v3",
    subject: "Congratulations {First_Name} - Offer from Syntellite",
    updated: "Aug 26",
    bodyText:
      "Dear {First_Name},\n\nWe are excited to extend an offer for the {Role} position.\nPlease review the attached details and let us know if you have any questions.\n\nRegards,\nSyntellite Talent Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>We are excited to extend an offer for the {Role} position.</p><p>Please review the attached details and let us know if you have any questions.</p><p>Regards,<br/>Syntellite Talent Team</p>',
  },
  {
    id: 2,
    name: "Rejection v2",
    subject: "Application Update - Syntellite",
    updated: "Aug 22",
    bodyText:
      "Dear {First_Name},\n\nThank you for your interest in Syntellite and the {Role} position.\nAfter careful consideration we will not be moving forward at this time.\n\nRegards,\nTalent Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>Thank you for your interest in Syntellite and the {Role} position.</p><p>After careful consideration we will not be moving forward at this time.</p><p>Regards,<br/>Talent Team</p>',
  },
  {
    id: 3,
    name: "Interview v1",
    subject: "Interview Schedule - Syntellite",
    updated: "Aug 21",
    bodyText:
      "Dear {First_Name},\n\nWe would like to invite you to interview for the {Role} position.\nPlease reply with your availability so we can confirm a slot.\n\nRegards,\nTalent Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>We would like to invite you to interview for the {Role} position.</p><p>Please reply with your availability so we can confirm a slot.</p><p>Regards,<br/>Talent Team</p>',
  },
];

export function TemplatesProvider({ children }) {
  const [templates, setTemplates] = useState(defaultTemplates);

  const addTemplate = (template) => {
    setTemplates((prev) => [
      ...prev,
      {
        ...template,
        id: Date.now(),
        updated: "Today",
      },
    ]);
  };

  const updateTemplate = (template) => {
    setTemplates((prev) =>
      prev.map((item) =>
        item.id === template.id
          ? {
              ...template,
              updated: "Today",
            }
          : item
      )
    );
  };

  const deleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <TemplatesContext.Provider value={{ templates, addTemplate, updateTemplate, deleteTemplate }}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  return useContext(TemplatesContext);
}
