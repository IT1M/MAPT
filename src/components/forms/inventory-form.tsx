'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { inventoryItemSchema } from '@/utils/validators';
import { Destination, InventoryItem } from '@prisma/client';
import toast from 'react-hot-toast';
import { z } from 'zod';

interface InventoryFormProps {
  item?: InventoryItem & {
    enteredBy: {
      id: string;
      name: string;
      email: string;
    };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  itemName: string;
  batch: string;
  quantity: string;
  reject: string;
  destination: Destination;
  category: string;
  notes: string;
}

interface FormErrors {
  itemName?: string;
  batch?: string;
  quantity?: string;
  reject?: string;
  destination?: string;
  category?: string;
  notes?: string;
}

export function InventoryForm({
  item,
  onSuccess,
  onCancel,
}: InventoryFormProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    itemName: item?.itemName || '',
    batch: item?.batch || '',
    quantity: item?.quantity?.toString() || '',
    reject: item?.reject?.toString() || '0',
    destination: item?.destination || 'MAIS',
    category: item?.category || '',
    notes: item?.notes || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Prepare data for validation
      const dataToValidate = {
        itemName: formData.itemName,
        batch: formData.batch,
        quantity: parseInt(formData.quantity),
        reject: parseInt(formData.reject),
        destination: formData.destination,
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      };

      // Validate with Zod
      const validationResult = inventoryItemSchema.safeParse(dataToValidate);

      if (!validationResult.success) {
        const fieldErrors: FormErrors = {};
        validationResult.error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        setLoading(false);
        return;
      }

      // Submit to API
      const url = item ? `/api/inventory/${item.id}` : '/api/inventory';
      const method = item ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationResult.data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(item ? t('success.updated') : t('success.created'));
        onSuccess?.();
      } else {
        if (
          result.error?.code === 'VALIDATION_ERROR' &&
          result.error?.details
        ) {
          const fieldErrors: FormErrors = {};
          result.error.details.forEach((err: any) => {
            const field = err.path[0] as keyof FormErrors;
            fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          toast.error(result.error?.message || t('errors.serverError'));
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('inventory.itemName')}
        name="itemName"
        type="text"
        value={formData.itemName}
        onChange={handleChange}
        error={errors.itemName}
        disabled={loading}
        required
      />

      <Input
        label={t('inventory.batch')}
        name="batch"
        type="text"
        value={formData.batch}
        onChange={handleChange}
        error={errors.batch}
        disabled={loading}
        required
      />

      <Input
        label={t('common.quantity')}
        name="quantity"
        type="number"
        value={formData.quantity}
        onChange={handleChange}
        error={errors.quantity}
        disabled={loading}
        required
        min="1"
      />

      <Input
        label={t('inventory.reject')}
        name="reject"
        type="number"
        value={formData.reject}
        onChange={handleChange}
        error={errors.reject}
        disabled={loading}
        min="0"
      />

      <Select
        label={t('common.destination')}
        name="destination"
        value={formData.destination}
        onChange={handleChange}
        error={errors.destination}
        disabled={loading}
        required
        options={[
          { value: 'MAIS', label: 'MAIS' },
          { value: 'FOZAN', label: 'FOZAN' },
        ]}
      />

      <Input
        label={t('inventory.category')}
        name="category"
        type="text"
        value={formData.category}
        onChange={handleChange}
        error={errors.category}
        disabled={loading}
      />

      <Input
        label={t('inventory.notes')}
        name="notes"
        type="text"
        value={formData.notes}
        onChange={handleChange}
        error={errors.notes}
        disabled={loading}
      />

      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
