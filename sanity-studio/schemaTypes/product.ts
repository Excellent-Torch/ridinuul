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
      title: 'Product Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required()
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