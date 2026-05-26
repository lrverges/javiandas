import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddressForm } from './AddressForm';
import type { Address } from './AddressCard';

describe('AddressForm', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn().mockResolvedValue(undefined);

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <AddressForm
                isOpen={false}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render empty form in creation mode', () => {
        render(
            <AddressForm
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByRole('heading', { name: /agregar dirección/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/calle \*/i)).toHaveValue('');
        expect(screen.getByLabelText(/número \*/i)).toHaveValue('');
        expect(screen.getByLabelText(/localidad \*/i)).toHaveValue('');
        expect(screen.getByLabelText(/referencia \/ info adicional/i)).toHaveValue('');
    });

    it('should populate fields in edit mode', () => {
        const addressToEdit: Address = {
            id: 2,
            userId: 1,
            street: 'San Martin',
            number: '123',
            locality: 'Yerba Buena',
            reference: 'Depto 4B',
            isDefault: false
        };

        render(
            <AddressForm
                isOpen={true}
                address={addressToEdit}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByRole('heading', { name: /editar dirección/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/calle \*/i)).toHaveValue('San Martin');
        expect(screen.getByLabelText(/número \*/i)).toHaveValue('123');
        expect(screen.getByLabelText(/localidad \*/i)).toHaveValue('Yerba Buena');
        expect(screen.getByLabelText(/referencia \/ info adicional/i)).toHaveValue('Depto 4B');
    });

    it('should display validation errors for required fields on submit', async () => {
        render(
            <AddressForm
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        const saveBtn = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(saveBtn);

        expect(await screen.findByText('La calle es requerida')).toBeInTheDocument();
        expect(screen.getByText('El número es requerido')).toBeInTheDocument();
        expect(screen.getByText('La localidad es requerida')).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should call onSave and onClose with valid data', async () => {
        render(
            <AddressForm
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        fireEvent.change(screen.getByLabelText(/calle \*/i), { target: { value: 'Av. Aconquija' } });
        fireEvent.change(screen.getByLabelText(/número \*/i), { target: { value: '2000' } });
        fireEvent.change(screen.getByLabelText(/localidad \*/i), { target: { value: 'Yerba Buena' } });
        fireEvent.change(screen.getByLabelText(/referencia \/ info adicional/i), { target: { value: 'Frente a la plaza' } });

        const saveBtn = screen.getByRole('button', { name: /guardar/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                street: 'Av. Aconquija',
                number: '2000',
                locality: 'Yerba Buena',
                reference: 'Frente a la plaza'
            });
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('should call onClose when clicking Cancel', () => {
        render(
            <AddressForm
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
        fireEvent.click(cancelBtn);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
