import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'image',
      title: 'Main Product Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'images',
      title: 'Additional Images',
      description: 'Add more images to create a gallery. The main image will be shown first.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          }
        }
      ]
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required().max(200)
    }),
    defineField({
      name: 'price',
      title: 'Price (LKR)',
      type: 'number',
      validation: Rule => Rule.required().positive()
    }),
    defineField({
      name: 'discountType',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'No Discount', value: 'none' },
          { title: 'Price Cut', value: 'priceCut' }
        ],
        layout: 'radio'
      },
      initialValue: 'none'
    }),
    defineField({
      name: 'discountValue',
      title: 'Discount Amount (LKR)',
      description: 'Amount to reduce from the original price.',
      type: 'number',
      hidden: ({ parent }) => parent?.discountType !== 'priceCut',
      validation: Rule =>
        Rule.custom((value, context) => {
          const parent = context.parent as { discountType?: string; price?: number };
          if (parent?.discountType !== 'priceCut') return true;
          if (value === undefined || value === null) {
            return 'Discount amount is required for Price Cut';
          }
          if (value < 0) {
            return 'Discount amount cannot be negative';
          }
          if (typeof parent?.price === 'number' && value >= parent.price) {
            return 'Discount amount must be less than the product price';
          }
          return true;
        })
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Shirts', value: 'shirts' },
          { title: 'Dresses', value: 'dresses' },
          { title: 'Tops', value: 'tops' },
          { title: 'Skirts', value: 'skirts' },
          { title: 'Pants', value: 'pants' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'customTag',
      title: 'Custom Tag',
      description: 'Optional custom badge text (e.g. "Valentine Special", "New Arrival", "New Year Special").',
      type: 'string',
      validation: Rule => Rule.max(40)
    }),
    defineField({
      name: 'customTagBgColor',
      title: 'Custom Tag Background Color',
      description: 'Optional background color for the custom tag badge.',
      type: 'color',
      hidden: ({ parent }) => !parent?.customTag
    }),
    defineField({
      name: 'customTagTextColor',
      title: 'Custom Tag Text Color',
      description: 'Optional text color for the custom tag badge.',
      type: 'color',
      hidden: ({ parent }) => !parent?.customTag
    }),
    defineField({
      name: 'shippingType',
      title: 'Shipping Type',
      type: 'string',
      options: {
        list: [
          { title: 'Free Shipping', value: 'free' },
          { title: 'Fixed Fee', value: 'fixed' },
          { title: 'Calculated', value: 'calculated' }
        ],
        layout: 'radio'
      },
      initialValue: 'free'
    }),
    defineField({
      name: 'shippingFee',
      title: 'Shipping Fee (LKR)',
      type: 'number',
      description: 'Required when shipping type is "Fixed Fee". Set to 0 for free shipping.',
      hidden: ({ parent }) => parent?.shippingType !== 'fixed',
      validation: Rule => Rule.custom((value, context) => {
        const parent = context.parent as { shippingType?: string };
        if (parent?.shippingType === 'fixed' && (value === undefined || value === null)) {
          return 'Shipping fee is required for fixed fee shipping';
        }
        if (value !== undefined && value !== null && value < 0) {
          return 'Shipping fee cannot be negative';
        }
        return true;
      })
    })
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
      subtitle: 'price'
    },
    prepare(selection) {
      const { title, media, subtitle } = selection;
      return {
        title,
        media,
        subtitle: `LKR ${subtitle}`
      };
    }
  }
});