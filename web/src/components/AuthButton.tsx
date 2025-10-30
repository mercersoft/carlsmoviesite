import { LogIn, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

export function AuthButton() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const { settings } = useSettings();

  // Determine display name: username > settings displayName > Google displayName > email
  const displayName = settings?.username ||
                      settings?.displayName ||
                      user?.displayName ||
                      user?.email;

  if (loading) {
    return (
      <Button variant="outline" disabled className="bg-transparent text-[hsl(240,67%,94%)] border-[hsl(225,30%,20%)]">
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button onClick={signInWithGoogle} variant="default" className="bg-[hsl(225,35%,15%)] text-[hsl(240,67%,94%)] hover:bg-[hsl(225,35%,20%)] border-[hsl(225,30%,20%)]">
        <LogIn className="h-4 w-4 mr-2" />
        Sign in with Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent text-[hsl(240,67%,94%)] border-[hsl(225,30%,20%)] hover:bg-[hsl(225,35%,15%)]">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName || 'User'}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
