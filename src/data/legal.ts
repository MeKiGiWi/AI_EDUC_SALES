export const legalContent = {
  company: {
    legalName: "Общество с ограниченной ответственностью «Цифровая методология»",
    shortName: "Цифровая методология",
    inn: "5010060840",
    kpp: "501001001",
    ogrn: "1235000008275"
  },
  pages: {
    privacyPolicy: "/legal/privacy-policy.html",
    personalDataAgreement: "/legal/personal-data-processing-agreement.html"
  },
  documents: {
    privacyPolicy: {
      label: "Политика конфиденциальности",
      href: "/legal/privacy-policy.docx"
    },
    personalDataAgreement: {
      label: "Согласие на обработку персональных данных",
      href: "/legal/personal-data-processing-agreement.docx"
    }
  }
} as const;

export type LegalDocumentLink = (typeof legalContent.documents)[keyof typeof legalContent.documents];
