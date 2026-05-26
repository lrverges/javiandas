import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddressCard } from './AddressCard';
import type { Address } from './AddressCard';

describe('AddressCard', () => {
    const mockAddress: Address = {
        id: 1,
        userId: 1,
        street: 'Av. Siempre Viva',
        number: '742',
        locality: 'Springfield',
        reference: 'Casa de los Simpsons',
        isDefault: false
    };

    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnSetDefault = vi.fn();

    it('should render address details correctly', () => {
        render(
            <AddressCard
                address={mockAddress}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onSetDefault={mockOnSetDefault}
            />
        );

        expect(screen.getByText('Av. Siempre Viva 742')).toBeInTheDocument();
        expect(screen.getByText('Springfield')).toBeInTheDocument();
        expect(screen.getByText('Casa de los Simpsons')).toBeInTheDocument();
        expect(screen.queryByText('Predeterminada')).not.toBeInTheDocument();
    });

    it('should show predeterminada badge if address is default', () => {
        const defaultAddress = { ...mockAddress, isDefault: true };
        render(
            <AddressCard
                address={defaultAddress}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onSetDefault={mockOnSetDefault}
            />
        );

        expect(screen.getByText('Predeterminada')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /establecer principal/i })).not.toBeInTheDocument();
        
        // Delete button should be disabled for default address
        const deleteBtn = screen.getByRole('button', { name: /eliminar dirección/i });
        expect(deleteBtn).toBeDisabled();
    });

    it('should show establecer principal and enabled delete button if not default', () => {
        render(
            <AddressCard
                address={mockAddress}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onSetDefault={mockOnSetDefault}
            />
        );

        const setDefaultBtn = screen.getByRole('button', { name: /establecer principal/i });
        expect(setDefaultBtn).toBeInTheDocument();
        
        const deleteBtn = screen.getByRole('button', { name: /eliminar dirección/i });
        expect(deleteBtn).toBeEnabled();
    });

    it('should call onSetDefault when click establecer principal', () => {
        render(
            <AddressCard
                address={mockAddress}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onSetDefault={mockOnSetDefault}
            />
        );

        const setDefaultBtn = screen.getByRole('button', { name: /establecer principal/i });
        fireEvent.click(setDefaultBtn);

        expect(mockOnSetDefault).toHaveBeenCalledWith(1);
    });

    it('should call onEdit when click edit button', () => {
        render(
            <AddressCard
                address={mockAddress}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onSetDefault={mockOnSetDefault}
            />
        );

        const editBtn = screen.getByRole('button', { name: /editar dirección/i });
        fireEvent.click(editBtn);

        expect(mockOnEdit).toHaveBeenCalledWith(mockAddress);
    });

    it('should call onDelete when click delete button', () => {
        render(
            <AddressCard
                address={mockAddress}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onSetDefault={mockOnSetDefault}
            />
        );

        const deleteBtn = screen.getByRole('button', { name: /eliminar dirección/i });
        fireEvent.click(deleteBtn);

        expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
});
