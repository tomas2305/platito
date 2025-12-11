import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconHome2,
  IconWallet,
  IconLayoutList,
  IconTag,
  IconFolder,
  IconSettings,
} from '@tabler/icons-react';
import { Stack, UnstyledButton } from '@mantine/core';
import classes from './Navbar.module.css';

interface NavbarLinkProps {
  readonly icon: typeof IconHome2;
  readonly label: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={classes.linkWrapper} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      {showTooltip && <div className={classes.tooltip}>{label}</div>}
      <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
        <Icon size={28} stroke={1.5} />
      </UnstyledButton>
    </div>
  );
}

const navigationLinks = [
  { icon: IconHome2, label: 'Home', path: '/' },
  { icon: IconWallet, label: 'Accounts', path: '/accounts' },
  { icon: IconLayoutList, label: 'Transactions', path: '/transactions' },
  { icon: IconFolder, label: 'Categories', path: '/categories' },
  { icon: IconTag, label: 'Tags', path: '/tags' },
  { icon: IconSettings, label: 'Settings', path: '/settings' },
];

export function Navbar() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const handleNavigation = (index: number, path: string) => {
    setActive(index);
    navigate(path);
  };

  const links = navigationLinks.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => handleNavigation(index, link.path)}
    />
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>
    </nav>
  );
}
