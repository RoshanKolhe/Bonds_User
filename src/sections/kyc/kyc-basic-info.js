import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { useMemo, useEffect, useState } from 'react';
import { useSnackbar } from 'src/components/snackbar';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Card } from '@mui/material';
// sections
import KYCTitle from './kyc-title';
import KYCFooter from './kyc-footer';
// assets
import { countries } from 'src/assets/data';
// components
import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField, RHFSelect, RHFAutocomplete } from 'src/components/hook-form';
import { useNavigate } from 'react-router';
import axiosInstance from 'src/utils/axios';
import dayjs from 'dayjs';
import RHFFileUploadBox from 'src/components/custom-file-upload/file-upload';
import YupErrorMessage from 'src/components/error-field/yup-error-messages';
import { useGetSectors } from 'src/api/sector';
import { useGetEntityTypes } from 'src/api/entityType';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function KYCBasicInfo() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [panExtractionStatus, setPanExtractionStatus] = useState('idle'); // 'idle' | 'success' | 'failed'
  const [extractedPanDetails, setExtractedPanDetails] = useState(null);
  const [uploadedPanFile, setUploadedPanFile] = useState(null);
  // State to store mapped API values
  const [sectorOptions, setSectorOptions] = useState([]);
  const [entityOptions, setEntityOptions] = useState([]);
  const { Sectors, SectorsEmpty } = useGetSectors();
  const { EntityTypes, EntityTypesEmpty } = useGetEntityTypes();

  useEffect(() => {
    if (Sectors && !SectorsEmpty) {
      setSectorOptions(Sectors);
    } else {
      setSectorOptions([]);
    }
  }, [Sectors, SectorsEmpty]);

  useEffect(() => {
    if (EntityTypes && !EntityTypesEmpty) {
      setEntityOptions(EntityTypes);
    } else {
      setEntityOptions([]);
    }
  }, [EntityTypes, EntityTypesEmpty]);

  const [humanInteraction, setHumanInteraction] = useState({
    companyName: false,
    gstin: false,
    dateOfIncorporation: false,
    msmeUdyamRegistrationNo: false,
    city: false,
    state: false,
    country: false,
    panNumber: false,
    dateOfBirth: false,
    panHoldersName: false,
    // other fields if you want to track
  });

  const handleHumanInteraction = (fieldName) => {
    if (!humanInteraction[fieldName]) {
      setHumanInteraction((prev) => ({
        ...prev,
        [fieldName]: true,
      }));
    }
  };

  const NewUserSchema = Yup.object().shape({
    cin: Yup.string().required('CIN is required'),
    companyName: Yup.string().required('Company Name is required'),
    gstin: Yup.string().required('GSTIN is required'),
    dateOfIncorporation: Yup.date().required('Date of Incorporation is required'),
    msmeUdyamRegistrationNo: Yup.string().required('MSME Udyam Registration No is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    country: Yup.string().required('Country is required'),
    panFile: Yup.mixed().required('PAN file is required'),
    panNumber: Yup.string().required('PAN Number is required'),
    dateOfBirth: Yup.date().required('Date Of Birth is required'),
    panHoldersName: Yup.string().required("PAN Holder's Name is required"),
    companyEntityTypeId: Yup.string().required('Entity Type is required'),
    companySectorTypeId: Yup.string().required('Sector is required'),
  });

  const defaultValues = useMemo(
    () => ({
      cin: '',
      companyName: '',
      gstin: '',
      dateOfIncorporation: null,
      msmeUdyamRegistrationNo: '',
      city: '',
      state: '',
      country: 'India',
      panFile: null,
      panNumber: '',
      dateOfBirth: null,
      panHoldersName: '',

      panCardDocumentId: '',
      humanInteraction: { ...humanInteraction },
    }),
    [humanInteraction]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    watch,
    formState: { isSubmitting, errors },
  } = methods;

  const allValues = watch();

  // ------------------------------------------
  // PAN Upload and Extraction Flow
  // /files -> /extract/pan-info
  // ------------------------------------------
  const handlePanUpload = async (file) => {
    try {
      // 1) Upload file to /files
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadRes = await axiosInstance.post('/files', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded = uploadRes?.data?.files?.[0];
      if (!uploaded || !uploaded.id) {
        throw new Error('PAN file upload failed');
      }

      setUploadedPanFile(uploaded);
      setValue('panCardDocumentId', uploaded.id, { shouldValidate: true });

      const extractRes = await axiosInstance.post('/extract/pan-info', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const panData = extractRes?.data?.data || extractRes?.data;

      // Adjust these keys according to your actual API response
      const panNumberFromApi = panData?.panNumber || panData?.extractedPanNumber || '';
      const dobFromApi =
        panData.extractedDateOfBirth && panData.extractedDateOfBirth !== ''
          ? panData.extractedDateOfBirth
          : null;
      const companyNameFromApi = panData?.companyName || panData?.extractedCompanyName || '';

      if (!panNumberFromApi && !dobFromApi && !companyNameFromApi) {
        // Treat as failure if nothing useful came back
        setPanExtractionStatus('failed');
        enqueueSnackbar(
          "We couldn't fetch details from your PAN document. Please fill the details manually.",
          { variant: 'error' }
        );
        return;
      }

      // Fill form values from extraction
      if (companyNameFromApi) {
        setValue('companyName', companyNameFromApi, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (panNumberFromApi) {
        setValue('panNumber', panNumberFromApi, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (dobFromApi) {
        setValue('dateOfBirth', dayjs(dobFromApi).toDate(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      // Save extracted details in state for final payload
      const extracted = {
        extractedCompanyName: companyNameFromApi || '',
        extractedPanNumber: panNumberFromApi || '',
        extractedDateOfBirth: (dobFromApi && dobFromApi !== '') ? dobFromApi : null,
      };

      setExtractedPanDetails(extracted);
      setPanExtractionStatus('success');

      enqueueSnackbar('PAN details extracted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error in PAN upload/extraction:', error);
      setPanExtractionStatus('failed');
      enqueueSnackbar(
        "We couldn't fetch details from your PAN document. Please fill the details manually.",
        { variant: 'error' }
      );
    }
  };

  // ------------------------------------------
  // Submit → /auth/company-registration
  // ------------------------------------------
  const onSubmit = handleSubmit(async (formData) => {
    try {
      // sessionId from storage (adjust key if needed)
      const sessionId = localStorage.getItem('sessionId') || '';

      const dateOfIncorporationStr = formData.dateOfIncorporation
        ? dayjs(formData.dateOfIncorporation).format('YYYY-MM-DD')
        : '';

      const dobStr = formData.dateOfBirth ? dayjs(formData.dateOfBirth).format('YYYY-MM-DD') : '';

      const companyName = formData.companyName || '';
      const panNumber = formData.panNumber || '';

      // Determine if user edited PAN-related fields vs extracted
      let userEditedPanFields = false;

      if (extractedPanDetails && panExtractionStatus === 'success') {
        const extractedDob = extractedPanDetails.extractedDateOfBirth || '';
        userEditedPanFields =
          extractedPanDetails.extractedCompanyName !== companyName ||
          extractedPanDetails.extractedPanNumber !== panNumber ||
          extractedDob !== dobStr;
      }

      // Build extractedPanDetails & submittedPanDetails and humanInteraction
      let extractedPanPayload = null;
      let submittedPanPayload = null;
      let humanInteractionFlag = false;

      if (panExtractionStatus === 'success' && extractedPanDetails) {
        if (userEditedPanFields) {
          // Case: PAN successfully extracted + user CHANGED values manually
          extractedPanPayload = { ...extractedPanDetails };
          submittedPanPayload = {
            submittedCompanyName: companyName,
            submittedPanNumber: panNumber,
            submittedDateOfBirth: dobStr,
          };
          humanInteractionFlag = true;
        } else {
          // Case: PAN successfully extracted + user did NOT change values manually
          // 👉 store extracted values only, set humanInteraction = false
          extractedPanPayload = { ...extractedPanDetails };
          submittedPanPayload = null;
          humanInteractionFlag = false;
        }
      } else {
        // Case: PAN extraction failed OR not called
        // 👉 store manually entered values in BOTH extracted & submitted
        extractedPanPayload = {
          extractedCompanyName: companyName,
          extractedPanNumber: panNumber,
          extractedDateOfBirth: dobStr,
        };
        submittedPanPayload = {
          submittedCompanyName: companyName,
          submittedPanNumber: panNumber,
          submittedDateOfBirth: dobStr,
        };
        humanInteractionFlag = true;
      }

      const payload = {
        sessionId,
        companyName: companyName,
        CIN: formData.cin || '',
        GSTIN: formData.gstin || '',
        udyamRegistrationNumber: formData.msmeUdyamRegistrationNo || '',
        dateOfIncorporation: dateOfIncorporationStr,
        cityOfIncorporation: formData.city || '',
        stateOfIncorporation: formData.state || '',
        countryOfIncorporation: formData.country || '',
        humanInteraction: humanInteractionFlag,
        extractedPanDetails: extractedPanPayload,
        submittedPanDetails: submittedPanPayload,
        panCardDocumentId: formData.panCardDocumentId || '',
        companySectorTypeId: formData.companySectorTypeId,
        companyEntityTypeId: formData.companyEntityTypeId,
      };

      console.log('Submitting payload to /auth/company-registration:', payload);

      const response = await axiosInstance.post('/auth/company-registration', payload);

      if (response?.data?.success) {
        enqueueSnackbar(response.data.message || 'Registration submitted successfully', {
          variant: 'success',
        });

        // Store returned status
        localStorage.setItem('kycStatus', response.data.kycStatus);

        // Redirect based on KYC Status
        if (response.data.kycStatus === 0) {
          navigate(paths.KYCPending);
        } else if (response.data.kycStatus === 1) {
          navigate(paths.KYCSuccessful);
        }

        reset();
      } else {
        throw new Error(response?.data?.message || 'Registration failed');
      }

      reset();
    } catch (error) {
      console.error(error);
      enqueueSnackbar(
        typeof error === 'string'
          ? error
          : error?.response?.data?.message || error?.message || 'Error occurred',
        {
          variant: 'error',
        }
      );
    }
  });

  // ----------------------------------------------------------------------

  return (
    <Container>
      <KYCTitle
        title="Welcome to Bond Issuer"
        subtitle={"Let's get you started please provide your details"}
      />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Card
          sx={{
            p: { xs: 2, sm: 3, md: 4 }, // responsive padding
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Grid container spacing={3} sx={{ py: 4 }}>
            <Grid xs={12} md={6} order={{ xs: 2, md: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:user-rounded-bold" width={24} />
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    CIN*
                  </Box>
                </Box>
                <RHFTextField
                  name="cin"
                  placeholder="Enter your CIN"
                  InputProps={{
                    endAdornment: (
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          bgcolor: '#00328A',
                          color: 'white',
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: '6px',
                          ml: 1,
                          '&:hover': { bgcolor: '#00328A' },
                        }}
                        onClick={async () => {
                          const cinValue = getValues('cin');
                          if (!cinValue) {
                            enqueueSnackbar('Please enter a CIN before fetching.', {
                              variant: 'warning',
                            });
                            return;
                          }

                          try {
                            const payload = { CIN: cinValue?.trim()?.toUpperCase() };

                            const response = await axiosInstance.post(
                              `/extraction/company-info`,
                              payload
                            );

                            const data = response?.data?.data;

                            if (response.data.success && data) {
                              // Set all the form fields from the response without triggering human interaction
                              setValue('companyName', data.companyName || '', {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue('gstin', data.gstin || '', {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue(
                                'dateOfIncorporation',
                                data.dateOfIncorporation
                                  ? new Date(data.dateOfIncorporation)
                                  : null,
                                { shouldValidate: true, shouldDirty: true }
                              );
                              setValue('city', data.cityOfIncorporation || '', {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue('state', data.stateOfIncorporation || '', {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue('country', data.countryOfIncorporation || 'India', {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setValue('panNumber', data.companyPanNumber || '', {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              enqueueSnackbar('CIN data fetched successfully', {
                                variant: 'success',
                              });
                            } else {
                              throw new Error(response.data.message || 'Failed to fetch CIN data');
                            }
                          } catch (error) {
                            console.error('Error fetching CIN:', error);
                            enqueueSnackbar(
                              error.response?.data?.message ||
                                'Failed to fetch CIN data. Please check CIN or try again.',
                              { variant: 'error' }
                            );
                          }
                        }}
                      >
                        Fetch
                      </Button>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:buildings-bold" width={24} />
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Company Name*
                  </Box>
                </Box>
                <RHFTextField
                  name="companyName"
                  placeholder="Enter your Company Name"
                  onFocus={() => handleHumanInteraction('companyName')}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:percentage-circle-bold" width={24} />
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    GSTIN*
                  </Box>
                </Box>
                <RHFTextField
                  name="gstin"
                  placeholder="Enter your GSTIN"
                  onFocus={() => handleHumanInteraction('gstin')}
                />
              </Box>
            </Grid>
            <Grid xs={12} md={6} order={{ xs: 1, md: 2 }}>
              <Box
                sx={{
                  height: { xs: 'auto', md: 'calc(3.82 * (56px + 24px))' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 0, md: 3 },
                }}
              >
                <Box
                  component="img"
                  src="/assets/images/kyc/kyc-basic-info/kyc-img.svg"
                  alt="KYC Illustration"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:calendar-bold" width={24} />
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Date of Incorporation*
                  </Box>
                </Box>
                <Controller
                  name="dateOfIncorporation"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        handleHumanInteraction('dateOfIncorporation');
                      }}
                      onOpen={() => handleHumanInteraction('dateOfIncorporation')}
                      format="dd-MM-yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:buildings-2-bold" width={24} />
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    MSME/Udyam Registration No.*
                  </Box>
                </Box>
                <RHFTextField
                  name="msmeUdyamRegistrationNo"
                  placeholder="Enter your MSME/Udyam Registration No."
                  // onFocus={() => handleHumanInteraction('msmeUdyamRegistrationNo')}
                />
              </Box>
            </Grid>
            <Grid xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:map-point-bold" width={24} />
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Place of Incorporation*
                  </Box>
                </Box>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <RHFTextField
                    name="city"
                    placeholder="City"
                    sx={{ flex: 1 }}
                    onFocus={() => handleHumanInteraction('city')}
                  />
                  <RHFSelect
                    name="state"
                    sx={{ flex: 1 }}
                    onFocus={() => handleHumanInteraction('state')}
                    SelectProps={{
                      displayEmpty: true,
                      onOpen: () => handleHumanInteraction('state'),
                      renderValue: (selected) =>
                        selected ? selected : <Box sx={{ color: 'text.disabled' }}>State</Box>,
                    }}
                  >
                    <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                  </RHFSelect>
                  <RHFAutocomplete
                    name="country"
                    placeholder="Country"
                    sx={{ flex: 1 }}
                    readOnly
                    onOpen={() => handleHumanInteraction('country')}
                    options={countries.map((country) => country.label)}
                    getOptionLabel={(option) => option}
                    renderOption={(props, option) => {
                      const { code, label, phone } = countries.find(
                        (country) => country.label === option
                      );
                      return (
                        <li {...props} key={label}>
                          <Iconify
                            key={label}
                            icon={`circle-flags:${code.toLowerCase()}`}
                            width={28}
                            sx={{ mr: 1 }}
                          />
                          {label} ({code}) +{phone}
                        </li>
                      );
                    }}
                  />
                </Stack>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon="solar:buildings-2-bold" width={24} />
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        Entity Type*
                      </Box>
                    </Box>
                    <RHFSelect name="companyEntityTypeId">
                      <MenuItem value="">Select Entity Type</MenuItem>
                      {entityOptions.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon="solar:chart-2-bold" width={24} />
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        Sector*
                      </Box>
                    </Box>
                    <RHFSelect name="companySectorTypeId">
                      <MenuItem value="">Select Entity Type</MenuItem>
                      {sectorOptions.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
          <Grid xs={12} md={12}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:document-upload-bold" width={24} />
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Upload PAN to Fill Details Automatically*
                </Box>
              </Box>
              <RHFFileUploadBox
                name="panFile"
                label="Upload PAN Card"
                icon="mdi:earth"
                color="#1e88e5"
                acceptedTypes="pdf,xls,docx,jpeg"
                maxSizeMB={10}
                onDrop={async (acceptedFiles) => {
                  const file = acceptedFiles[0];
                  if (file) {
                    setValue('panFile', file, { shouldValidate: true });
                    await handlePanUpload(file);
                  }
                }}
              />
              <YupErrorMessage name="panFile" />
            </Box>
          </Grid>
          <Grid container spacing={3}>
            {/* PAN Number (Left) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:card-bold" width={24} />
                <Box component="span" sx={{ fontWeight: 600 }}>
                  PAN Number*
                </Box>
              </Box>
              <RHFTextField
                name="panNumber"
                placeholder="Your PAN Number"
                onFocus={() => handleHumanInteraction('panNumber')}
              />
            </Grid>

            {/* Date of Birth (Right) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:calendar-bold" width={24} />
                <Box component="span" sx={{ fontWeight: 600 }}>
                  Date of Birth*
                </Box>
              </Box>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                      handleHumanInteraction('dateOfBirth');
                    }}
                    onOpen={() => handleHumanInteraction('dateOfBirth')}
                    format="yyyy-MM-dd"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        placeholder: 'YYYY-MM-DD',
                        error: !!error,
                        helperText: error?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* PAN Holder’s Name (Full width below) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:user-bold" width={24} />
                <Box component="span" sx={{ fontWeight: 600 }}>
                  PAN Holder's Name*
                </Box>
              </Box>
              <RHFTextField
                name="panHoldersName"
                placeholder="Enter Name as per PAN"
                onFocus={() => handleHumanInteraction('panHoldersName')}
              />
            </Grid>
          </Grid>
        </Card>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 4,
            mb: 4,
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/assets/images/kyc/kyc-trust.svg"
                alt="Trust"
                sx={{ width: 28, height: 28 }}
              />
              <Typography variant="body2">
                Trusted by{' '}
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  100+ Issuers
                </Box>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/assets/images/kyc/kyc-shield.svg"
                alt="Security"
                sx={{ width: 24, height: 24 }}
              />
              <Typography variant="body2">Your data is encrypted and secured</Typography>
            </Box>
          </Box>
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            sx={{
              bgcolor: 'grey.800',
              color: 'common.white',
              borderRadius: 1,
              px: 4,
              py: 1.5,
              '&:hover': { bgcolor: 'grey.900' },
            }}
            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Save & Continue
          </LoadingButton>
        </Box>
      </FormProvider>
      <KYCFooter />
    </Container>
  );
}
