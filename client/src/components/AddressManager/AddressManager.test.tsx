import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddressManager from './AddressManager';

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');

describe('AddressManager', () => {
    const mockAddresses = [
        { id: 1, userId: 1, street: 'Calle 1', number: '123', locality: 'Lules', reference: 'Casa', isDefault: true },
        { id: 2, userId: 1, street: 'Calle 2', number: '456', locality: 'Yerba Buena', reference: 'Trabajo', isDefault: false }
    ];

    beforeEach(() => {
        vi.restoreAllMocks();
        // Stub global window.confirm
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    });

    it('should fetch and render addresses on mount', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockAddresses })
        });
        vi.stubGlobal('fetch', mockFetch);

        render(<AddressManager />);

        // Verify loading spinner is shown initially
        expect(screen.getByStyle ? screen.getByStyle(/border-top-color: #22c55e/i) : document.querySelector('.spinner')).toBeInTheDocument();

        // Verify API is called
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/users/me/addresses', expect.objectContaining({
            credentials: 'include'
        }));

        // Verify addresses are rendered
        expect(await screen.findByText('Calle 1 123')).toBeInTheDocument();
        expect(await screen.findByText('Calle 2 456')).toBeInTheDocument();
    });

    it('should show empty state if no addresses exist', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: [] })
        });
        vi.stubGlobal('fetch', mockFetch);

        render(<AddressManager />);

        expect(await screen.findByText('No tenés ninguna dirección de entrega registrada.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /agregar mi primera dirección/i })).toBeInTheDocument();
    });

    it('should show error banner if fetch fails', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ success: false, message: 'Restricción corporativa' })
        });
        vi.stubGlobal('fetch', mockFetch);

        render(<AddressManager />);

        expect(await screen.findByText('Error al obtener tus direcciones.')).toBeInTheDocument();
    });

    it('should handle set default address action', async () => {
        const mockFetch = vi.fn()
            // First fetch (list)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: mockAddresses })
            })
            // Put fetch (set default)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, message: 'Dirección predeterminada actualizada' })
            })
            // Second fetch (list reload)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: [
                        { ...mockAddresses[0], isDefault: false },
                        { ...mockAddresses[1], isDefault: true }
                    ]
                })
            });
        vi.stubGlobal('fetch', mockFetch);

        render(<AddressManager />);

        // Wait for list to render
        const setDefaultBtn = await screen.findByRole('button', { name: /establecer principal/i });
        fireEvent.click(setDefaultBtn);

        // Verify PUT API is called
        await waitFor(() => {
            expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/users/me/addresses/2/default', expect.objectContaining({
                method: 'PUT'
            }));
        });

        // Verify list is reloaded and toast is shown
        expect(await screen.findByText('Dirección principal actualizada')).toBeInTheDocument();
    });

    it('should handle delete address action', async () => {
        const mockFetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: mockAddresses })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, message: 'Dirección eliminada' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: [mockAddresses[0]] })
            });
        vi.stubGlobal('fetch', mockFetch);

        render(<AddressManager />);

        // Wait for list to render
        await screen.findByText('Calle 2 456');
        const deleteBtns = screen.getAllByRole('button', { name: /eliminar dirección/i });
        fireEvent.click(deleteBtns[1]);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/users/me/addresses/2', expect.objectContaining({
                method: 'DELETE'
            }));
        });

        expect(await screen.findByText('Dirección eliminada con éxito')).toBeInTheDocument();
    });
});
