import React, { useState } from 'react';
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import { CategorySearchableDropdown } from '@/components/ui/category-searchable-dropdown';
import { SupplierSearchableDropdown } from '@/components/ui/supplier-searchable-dropdown';

export default function ExampleUsage() {
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Contoh Penggunaan Searchable Dropdowns</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Department</label>
          <DepartmentSearchableDropdown
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
            placeholder="Pilih department..."
            apiEndpoint="/departments/api/search"
          />
        </div>

        {/* Category Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <CategorySearchableDropdown
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder="Pilih kategori..."
            apiEndpoint="/item-categories/api/search"
          />
        </div>

        {/* Supplier Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier</label>
          <SupplierSearchableDropdown
            value={selectedSupplier}
            onValueChange={setSelectedSupplier}
            placeholder="Pilih supplier..."
            apiEndpoint="/suppliers/api/search"
          />
        </div>
      </div>

      {/* Display Selected Values */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Selected Values:</h3>
        <ul className="space-y-1 text-sm">
          <li>Department ID: {selectedDepartment || 'None'}</li>
          <li>Category ID: {selectedCategory || 'None'}</li>
          <li>Supplier ID: {selectedSupplier || 'None'}</li>
        </ul>
      </div>

      {/* With Error State */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">With Error State</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DepartmentSearchableDropdown
            value={null}
            onValueChange={() => {}}
            placeholder="Department with error..."
            error={true}
          />
          <CategorySearchableDropdown
            value={null}
            onValueChange={() => {}}
            placeholder="Category with error..."
            error={true}
          />
          <SupplierSearchableDropdown
            value={null}
            onValueChange={() => {}}
            placeholder="Supplier with error..."
            error={true}
          />
        </div>
      </div>

      {/* Disabled State */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Disabled State</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DepartmentSearchableDropdown
            value={null}
            onValueChange={() => {}}
            placeholder="Disabled department..."
            disabled={true}
          />
          <CategorySearchableDropdown
            value={null}
            onValueChange={() => {}}
            placeholder="Disabled category..."
            disabled={true}
          />
          <SupplierSearchableDropdown
            value={null}
            onValueChange={() => {}}
            placeholder="Disabled supplier..."
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
}
