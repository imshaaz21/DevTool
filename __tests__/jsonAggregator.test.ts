import {
  aggregateJson,
  discoverFields,
  safeAdd,
  cleanNumber,
  formatExtractedValues,
} from '@/lib/jsonAggregator';

describe('jsonAggregator library', () => {
  const sampleInvoiceData = [
    {
      payerId: 1001,
      payerContractId: 2001,
      payerPolicyId: 2001,
      policyNumber: '123',
      hospitalId: 151,
      hospitalGroupId: 58,
      clinicId: 37813,
      doctorId: 75721,
      appointmentId: 5591729,
      invoiceVisitId: 325621345,
      encounterType: 'OPD',
      pomrId: 9330919,
      batchRefNo: 'CLM-S2026013022882632288263',
      status: 'ACTIVE',
      invoiceDate: '2026-01-30 14:35:17',
      claimType: 'OPD',
      patientId: 893416,
      services: [
        {
          lineItemNo: 1,
          servicePrimaryId: 76087574,
          serviceType: 'PROCEDURE',
          serviceCode: '03035003901',
          standardCode: 'we3',
          serviceQuantity: 1,
          serviceReferenceNumber: 'INV-S2026013022882622288262',
          grossAmount: 96.0,
          netAmount: 96.0,
          discountPercentage: 0.0,
          discountAmount: 0.0,
          patientSharePercentage: 0.0,
          companySharePercentage: 100.0,
          patientShareAmount: 0.0,
          companyShareAmount: 96.0,
          companyTax: 14.4,
          patientTax: 0.0,
          encounterType: 'OPD',
          serviceDiscountPct: 0.0,
          serviceDiscountAmount: 0.0,
          serviceDeductibleAmount: 0.0,
          serviceReimbursementAmount: 96.0,
          orderId: 240385082,
          patientOrderId: 23466974,
          categoryId: 66,
          categoryCode: 3,
          groupId: 527317,
          subGroupId: 259,
          isInterCompanyOrder: false,
          isDental: false,
          chiSbsCode: '58100-00-00',
          packageDetails: [],
        },
        {
          lineItemNo: 2,
          servicePrimaryId: 76087575,
          serviceType: 'PROCEDURE',
          serviceCode: '03035004138',
          standardCode: 'we3',
          serviceQuantity: 1,
          serviceReferenceNumber: 'INV-S2026013022882622288262',
          grossAmount: 229.6,
          netAmount: 229.6,
          discountPercentage: 0.0,
          discountAmount: 0.0,
          patientSharePercentage: 0.0,
          companySharePercentage: 100.0,
          patientShareAmount: 0.0,
          companyShareAmount: 229.6,
          companyTax: 34.44,
          patientTax: 0.0,
          encounterType: 'OPD',
          serviceDiscountPct: 0.0,
          serviceDiscountAmount: 0.0,
          serviceDeductibleAmount: 0.0,
          serviceReimbursementAmount: 229.6,
          orderId: 240385082,
          patientOrderId: 23466975,
          categoryId: 66,
          categoryCode: 3,
          groupId: 527317,
          subGroupId: 259,
          isInterCompanyOrder: false,
          isDental: false,
          chiSbsCode: '57945-00-00',
          packageDetails: [],
        },
      ],
      invoiceNo: 'INV-S2026013022882622288262',
      invoiceStatus: 'ACTIVE',
      isInterCompanyInvoice: false,
      isDischargeMedication: false,
      isMohClaim: false,
    },
  ];

  describe('safeAdd and cleanNumber', () => {
    it('accurately adds decimal values without floating point precision issues', () => {
      expect(safeAdd(14.4, 34.44)).toBe(48.84);
      expect(safeAdd(0.1, 0.2)).toBe(0.3);
      expect(safeAdd(96.0, 229.6)).toBe(325.6);
    });

    it('cleans floating numbers correctly', () => {
      expect(cleanNumber(48.84000000000001)).toBe(48.84);
      expect(cleanNumber(100)).toBe(100);
    });
  });

  describe('discoverFields', () => {
    it('discovers all fields and calculates numeric sums for candidates', () => {
      const fields = discoverFields(sampleInvoiceData);
      expect(fields.length).toBeGreaterThan(10);

      const companyShare = fields.find(f => f.key === 'companyShareAmount');
      expect(companyShare).toBeDefined();
      expect(companyShare?.count).toBe(2);
      expect(companyShare?.numericCount).toBe(2);
      expect(companyShare?.sum).toBe(325.6);

      const packageDetails = fields.find(f => f.key === 'packageDetails');
      expect(packageDetails).toBeDefined();
      expect(packageDetails?.isArrayField).toBe(true);
    });

    it('filters discovered fields to only those containing amount or price when amountOrPriceOnly is true', () => {
      const filteredFields = discoverFields(sampleInvoiceData, { amountOrPriceOnly: true });
      expect(filteredFields.length).toBeGreaterThan(0);
      for (const field of filteredFields) {
        const matches = /amount|price/i.test(field.key) || /amount|price/i.test(field.simplifiedPath);
        expect(matches).toBe(true);
      }
      // doctorId or payerId should not be included
      expect(filteredFields.some(f => f.key === 'doctorId')).toBe(false);
      expect(filteredFields.some(f => f.key === 'payerId')).toBe(false);
      // companyShareAmount and grossAmount should be included
      expect(filteredFields.some(f => f.key === 'companyShareAmount')).toBe(true);
      expect(filteredFields.some(f => f.key === 'grossAmount')).toBe(true);
    });
  });

  describe('aggregateJson with pattern matching', () => {
    it('sums companyShareAmount via services.*.companyShare pattern', () => {
      const result = aggregateJson(sampleInvoiceData, 'services.*.companyShareAmount');
      expect(result.items.length).toBe(2);
      expect(result.stats.sum).toBe(325.6);
      expect(result.stats.avg).toBe(162.8);
      expect(result.stats.min).toBe(96.0);
      expect(result.stats.max).toBe(229.6);
      expect(result.stats.numericCount).toBe(2);
    });

    it('matches via wildcard services.*.companyShare', () => {
      const result = aggregateJson(sampleInvoiceData, 'services.*.companyShare');
      // matches companySharePercentage and companyShareAmount
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      const shareAmountItems = result.items.filter(i => i.key === 'companyShareAmount');
      expect(shareAmountItems.length).toBe(2);
    });

    it('matches simplified dot path services.companyShareAmount', () => {
      const result = aggregateJson(sampleInvoiceData, 'services.companyShareAmount');
      expect(result.items.length).toBe(2);
      expect(result.stats.sum).toBe(325.6);
    });

    it('matches direct key name companyShareAmount', () => {
      const result = aggregateJson(sampleInvoiceData, 'companyShareAmount');
      expect(result.items.length).toBe(2);
      expect(result.stats.sum).toBe(325.6);
    });

    it('calculates companyTax accurately with decimals', () => {
      const result = aggregateJson(sampleInvoiceData, 'companyTax');
      expect(result.items.length).toBe(2);
      expect(result.stats.sum).toBe(48.84);
    });

    it('matches array fields like packageDetails', () => {
      const result = aggregateJson(sampleInvoiceData, 'packageDetails');
      expect(result.items.length).toBe(2);
      expect(result.stats.arrayLengthSum).toBe(0);
    });

    it('handles numeric strings when parseNumericStrings option is true', () => {
      const stringData = {
        items: [
          { cost: '10.5' },
          { cost: '20.25' },
        ],
      };
      const result = aggregateJson(stringData, 'cost', { parseNumericStrings: true });
      expect(result.stats.numericCount).toBe(2);
      expect(result.stats.sum).toBe(30.75);
    });

    it('aggregates across multiple root-level invoices', () => {
      const multiInvoices = [
        ...sampleInvoiceData,
        {
          invoiceNo: 'INV-2',
          services: [
            {
              lineItemNo: 1,
              companyShareAmount: 100.0,
            },
          ],
        },
      ];
      const result = aggregateJson(multiInvoices, 'services.*.companyShareAmount');
      expect(result.items.length).toBe(3);
      expect(result.stats.sum).toBe(425.6);
    });
  });

  describe('formatExtractedValues', () => {
    it('formats items into json, newline, csv, and sum', () => {
      const result = aggregateJson(sampleInvoiceData, 'companyShareAmount');
      const jsonFormat = formatExtractedValues(result.items, 'json');
      expect(JSON.parse(jsonFormat)).toEqual([96.0, 229.6]);

      const newlineFormat = formatExtractedValues(result.items, 'newline');
      expect(newlineFormat).toBe('96\n229.6');

      const sumFormat = formatExtractedValues(result.items, 'sum');
      expect(sumFormat).toBe('325.6');

      const csvFormat = formatExtractedValues(result.items, 'csv');
      expect(csvFormat).toContain('Index,Path,Key,Value');
      expect(csvFormat).toContain('companyShareAmount');
    });
  });
});
