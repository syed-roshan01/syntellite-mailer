import React, { useState } from "react";
import Section from "../components/Section";
import { useVariables } from "../hooks/useVariables";

function ScreenPreview() {
  const { vars, names, resolve } = useVariables();

  const candidates = [
    { First_Name: "Roshan", Last_Name: "Syed", Email: "roshan@syntellite.com", Role: "Backend Intern" },
    { First_Name: "Aisha", Last_Name: "Khan", Email: "aisha@syntellite.com", Role: "UI Designer" },
  ];

  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]);
  const [template, setTemplate] = useState({
    subject: "Congratulations {First_Name} - Offer from Syntellite",
    bodyText:
      "Dear {First_Name},\n\nWe are excited to offer you the role of {Role} at {Company_Name}.\nYour offer letter: {Offer_Letter_Link}\n\nRegards,\nHR Team",
    bodyHtml:
      '<p>Dear {First_Name},</p><p>We are excited to offer you the role of {Role} at {Company_Name}.</p><p>Your offer letter: {Offer_Letter_Link}</p><p>Regards,<br/>HR Team</p>',
  });

  const subjectPreview = resolve(template.subject, selectedCandidate);
  const bodyTextPreview = template.bodyText
    ? resolve(template.bodyText, selectedCandidate)
    : "";
  const bodyHtmlPreview = template.bodyHtml
    ? resolve(template.bodyHtml, selectedCandidate)
    : "";

  return (
    <div className="grid gap-6">
      <Section title="Preview Merge">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Candidate</label>
            <select
              className="px-3 py-2 border rounded-xl"
              value={selectedCandidate.Email}
              onChange={(event) => {
                const candidate = candidates.find((item) => item.Email === event.target.value);
                setSelectedCandidate(candidate);
              }}
            >
              {candidates.map((candidate) => (
                <option key={candidate.Email} value={candidate.Email}>
                  {candidate.First_Name} {candidate.Last_Name} ({candidate.Role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm">Template</label>
            <select
              className="px-3 py-2 border rounded-xl"
              onChange={(event) => {
                if (event.target.value === "offer") {
                  setTemplate({
                    subject: "Congratulations {First_Name} - Offer from {Company_Name}",
                    bodyText:
                      "Dear {First_Name},\n\nWe are excited to offer you the role of {Role}.\nOffer: {Offer_Letter_Link}\n\nRegards,\nHR",
                    bodyHtml:
                      '<p>Dear {First_Name},</p><p>We are excited to offer you the role of {Role}.</p><p>Offer: {Offer_Letter_Link}</p><p>Regards,<br/>HR</p>',
                  });
                } else if (event.target.value === "rejection") {
                  setTemplate({
                    subject: "Application Update - {Company_Name}",
                    bodyText:
                      "Dear {First_Name},\n\nThank you for applying for {Role}. Unfortunately we are unable to continue at this time.\n\nRegards,\nTalent Team",
                    bodyHtml:
                      '<p>Dear {First_Name},</p><p>Thank you for applying for {Role}. Unfortunately we are unable to continue at this time.</p><p>Regards,<br/>Talent Team</p>',
                  });
                }
              }}
            >
              <option value="offer">Offer Template</option>
              <option value="rejection">Rejection Template</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-2">Subject Preview</div>
            <div className="font-medium">{subjectPreview}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-2">Body Preview</div>
            {template.bodyHtml ? (
              <div
                className="text-sm leading-6"
                dangerouslySetInnerHTML={{ __html: bodyHtmlPreview }}
              />
            ) : (
              <pre className="text-sm whitespace-pre-wrap leading-6">{bodyTextPreview}</pre>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

export default ScreenPreview;
