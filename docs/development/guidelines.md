# Development Guidelines

This document outlines the development standards, best practices, and conventions for the Sika Shopping Cart Management System.

## Code Organization

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/UI components
│   ├── AuthProvider.tsx # Authentication context
│   ├── Header.tsx      # Navigation component
│   └── ProtectedRoute.tsx # Route protection
├── pages/              # Route-level components
│   ├── Auth.tsx        # Authentication page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── RequestForm.tsx # Request creation/editing
│   ├── RequestDetail.tsx # Request details
│   └── Admin.tsx       # Admin panel
├── lib/                # Utility libraries
│   ├── supabase.ts     # Database operations
│   └── utils.ts        # General utilities
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── assets/             # Static assets
└── types/              # TypeScript type definitions
```

### File Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`utils.ts`)
- **Pages**: PascalCase (`Dashboard.tsx`)
- **Types**: PascalCase (`UserTypes.ts`)

## TypeScript Guidelines

### Type Definitions

```typescript
// Use Supabase-generated types
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ShoppingRequest = Database['public']['Tables']['shopping_requests']['Row'];

// Extend types when needed
interface ShoppingRequestWithItems extends ShoppingRequest {
  request_items: RequestItem[];
  requester: Profile;
  manager_approval: Profile | null;
}
```

### Component Props

```typescript
interface ComponentProps {
  // Required props
  id: string;
  title: string;
  
  // Optional props
  className?: string;
  onClick?: () => void;
  
  // Children
  children?: React.ReactNode;
}

const Component: React.FC<ComponentProps> = ({ 
  id, 
  title, 
  className,
  onClick,
  children 
}) => {
  // Component implementation
};
```

### Async Functions

```typescript
// Always handle errors
async function fetchData(): Promise<Data | null> {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}
```

## React Best Practices

### Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { ComponentProps } from './types';

// 1. Component definition
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 2. State hooks
  const [state, setState] = useState<StateType>(initialValue);
  
  // 3. Effect hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 4. Custom hooks
  const { data, loading } = useCustomHook();
  
  // 5. Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 6. Derived state
  const computedValue = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);
  
  // 7. Early returns
  if (loading) return <LoadingSpinner />;
  if (!data) return <NoData />;
  
  // 8. Main render
  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  );
};

export default Component;
```

### Custom Hooks

```typescript
// useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Auth logic
  }, []);
  
  return { user, loading };
};

// Usage
const { user, loading } = useAuth();
```

### State Management

```typescript
// Context for global state
const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Local state for component-specific data
const [localState, setLocalState] = useState<LocalStateType>(initialValue);
```

## Styling Guidelines

### Tailwind CSS Usage

```typescript
// Use semantic tokens from design system
const Button = ({ variant = 'primary', ...props }) => (
  <button 
    className={cn(
      'px-4 py-2 rounded-md font-medium transition-colors',
      variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
      variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      props.className
    )}
    {...props}
  />
);
```

### Component Variants

```typescript
// Use class-variance-authority for component variants
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
  {/* Content */}
</div>
```

## Data Fetching Patterns

### TanStack Query Usage

```typescript
// Query hook
const useShoppingRequests = () => {
  return useQuery({
    queryKey: ['shopping-requests'],
    queryFn: getShoppingRequests,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation hook
const useCreateRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createShoppingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping-requests']);
    },
    onError: (error) => {
      console.error('Error creating request:', error);
    },
  });
};
```

### Error Handling

```typescript
// API error handling
const handleApiError = (error: any) => {
  if (error.code === 'PGRST301') {
    throw new Error('Access denied');
  }
  if (error.message?.includes('unique constraint')) {
    throw new Error('Duplicate entry');
  }
  throw new Error(error.message || 'An unexpected error occurred');
};

// Component error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Form Handling

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema definition
const requestSchema = z.object({
  requestType: z.string().min(1, 'Request type is required'),
  justification: z.string().min(10, 'Justification must be at least 10 characters'),
  deliveryDate: z.date().min(new Date(), 'Delivery date must be in the future'),
});

type RequestFormData = z.infer<typeof requestSchema>;

// Form component
const RequestForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const onSubmit = async (data: RequestFormData) => {
    try {
      await createRequest(data);
      reset();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('requestType')} />
      {errors.requestType && <span>{errors.requestType.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Request'}
      </button>
    </form>
  );
};
```

## Security Best Practices

### Input Validation

```typescript
// Always validate user inputs
const validateInput = (input: string): boolean => {
  // Check for XSS patterns
  const xssPattern = /<script|javascript:|data:text\/html/i;
  if (xssPattern.test(input)) {
    return false;
  }
  
  // Additional validation logic
  return true;
};
```

### Authentication Checks

```typescript
// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" />;
  if (requiredRole && profile?.role !== requiredRole) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

### Data Sanitization

```typescript
// Sanitize data before display
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html);
};
```

## Testing Guidelines

### Unit Tests

```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### API Testing

```typescript
// Mock Supabase client for testing
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockData, error: null }))
        }))
      }))
    }))
  }
}));
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RequestForm = lazy(() => import('./pages/RequestForm'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Memoization

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);

// Memoize components
const MemoizedComponent = React.memo(Component);
```

### Virtual Scrolling

```typescript
// For large lists, consider virtual scrolling
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {Row}
  </List>
);
```

## Git Workflow

### Commit Messages

```
feat: add shopping cart functionality
fix: resolve authentication redirect issue
docs: update API documentation
style: improve button component styling
refactor: extract common form logic
test: add unit tests for auth service
chore: update dependencies
```

### Branch Naming

```
feature/shopping-cart
bugfix/auth-redirect
hotfix/security-patch
release/v1.0.0
```

### Pull Request Guidelines

1. **Title**: Clear, descriptive title
2. **Description**: What changes were made and why
3. **Testing**: How the changes were tested
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Document any breaking changes

## Documentation Standards

### Code Comments

```typescript
/**
 * Creates a new shopping request with automatic request number generation
 * @param request - The request data to create
 * @returns Promise resolving to the created request
 * @throws Error if user is not authenticated or request creation fails
 */
async function createShoppingRequest(
  request: Partial<ShoppingRequest>
): Promise<ShoppingRequest> {
  // Implementation
}
```

### README Files

Each major directory should have a README.md explaining:
- Purpose of the directory
- Key files and their responsibilities
- Usage examples
- Dependencies

## Deployment

### Environment Configuration

```typescript
// Use environment variables for configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  isDevelopment: process.env.NODE_ENV === 'development',
};
```

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
        },
      },
    },
  },
});
```

---

Following these guidelines ensures consistent, maintainable, and scalable code across the entire project.