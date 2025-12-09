// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
// routes
import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hook';
import { RouterLink } from 'src/routes/components';
// _mock
import { _socials } from 'src/_mock';
// components
import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const LINKS = [
  {
    headline: 'About us',
    children: [
      { name: 'Our Company', href: paths.about },
      { name: 'Values' },
      { name: 'FAQs', href: paths.faqs },
    ],
  },
  {
    headline: 'Become a issuer',
    children: [
      { name: 'Issuer', href: paths.issuer },
    ],
  },
  {
    headline: 'Resources',
    children: [
      { name: 'Blog', href: paths.post.root },
      { name: 'Bonds Calculator', href: paths.calculator },
      { name: 'News & Insight', hre: paths.newsInsight },
    ],
  },
  {
    headline: 'Legal',
    children: [
      { name: 'Terms and Condition', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
  },
  {
    headline: 'Contact',
    children: [{ name: 'support@projectbond.cc', href: '#' }],
  },
];

// ----------------------------------------------------------------------

export default function Footer() {
  const pathname = usePathname();

  const isHome = pathname === '/';

  const simpleFooter = (
    <Box
      component="footer"
      sx={{
        py: 5,
        textAlign: 'center',
        position: 'relative',
        bgcolor: 'background.default',
      }}
    >
      <Container>
        <Logo sx={{ mb: 1, mx: 'auto' }} />

        <Typography variant="caption" component="div">
          © All rights reserved
          <br /> made by
          <Link href="https://minimals.cc/"> minimals.cc </Link>
        </Typography>
      </Container>
    </Box>
  );

  const mainFooter = (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        bgcolor: '#001D4F',
        color: '#ffffff',
        pt: 3,
        pb: 3,
        pl: 6,
        pr: 3,
      }}
    >
      <Container maxWidth="xl">

        {/* TOP ROW (Logo + Columns) */}
        <Grid container spacing={5} justifyContent="space-between">


          <Grid xs={12} md={4}>
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
                width: '100'
              }}
            >
              <img
                src="/logo/footer-logo.png"
                alt="Footer Logo"
                style={{
                  width: 150,
                  height: 'auto',
                }}
              />


            </Box>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              A secure and transparent platform dedicated to helping investors access high-quality bonds,
              make informed decisions, and build long-term financial stability with confidence.
            </Typography>
          </Grid>

          <Grid xs={12} md={8}>
            <Grid container spacing={4}>

              {LINKS.map((list) => (
                <Grid key={list.headline} xs={6} sm={4} md={2.4}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 700, color: '#ffffff' }}
                  >
                    {list.headline}
                  </Typography>

                  <Stack spacing={1.2} sx={{ mt: 1 }}>
                    {list.children.map((link) => (
                      <Link
                        key={link.name}
                        component={RouterLink}
                        href={link.href}
                        sx={{
                          color: '#d7d7d7',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          '&:hover': { color: '#fff' },
                        }}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </Stack>
                </Grid>
              ))}


            </Grid>
          </Grid>
        </Grid>

        {/* HELP SECTION */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Help and Support:
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 1, maxWidth: 'lg', color: '#d7d7d7' }}
          >
            Need help with KYC or bond investing? Our team is here to assist you with verification,
            bond insights, and all your platform queries.
          </Typography>
        </Box>

        {/* DISCLAIMER */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Disclaimer :
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 1, maxWidth: 'lg', color: '#d7d7d7' }}
          >
            Our platform enables access to listed, unlisted, corporate, and government bond opportunities,
            but we do not provide financial, legal, or tax advice. All information displayed is for
            educational and informational purposes only and may be based on publicly available data.
            Issuer details, ratings, yields, coupon rates, and maturity information are provided as
            received from issuers, rating agencies, or authorized market sources. We do not guarantee
            the accuracy, completeness, or timeliness of this information. The responsibility for
            reviewing, verifying, and assessing any bond rests solely with the investor.
          </Typography>
        </Box>

        {/* COPYRIGHT */}
        <Typography
          variant="body2"
          sx={{
            mt: 5,
            textAlign: 'center',
            color: '#ffffff',
            opacity: 0.8,
          }}
        >
          © 2025. All rights reserved
        </Typography>
      </Container>
    </Box>
  );

  return mainFooter;
}
