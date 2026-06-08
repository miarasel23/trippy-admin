import { useContext } from 'react';
import { AuthContextTrippy } from '../context/AuthContextTrippy';

export const translations = {
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    trip: 'Trip',
    customer: 'Customer',
    rider: 'Rider',
    settings: 'Settings',
    carSetup: 'Car Setup',
    action: 'Action',
    actionWithLanguage: 'Action with Language',
    rolePermission: 'Role Permission',
    driverSubscription: 'Driver Subscription',
    userSetting: 'User Setting',
    adminUser: 'Admin User',
    actionsHeader: 'ACTIONS',
    signOut: 'Sign Out',

    // AdminUser List Page
    adminUserList: 'Admin User List',
    firstName: 'First Name',
    lastName: 'Last Name',
    username: 'Username',
    email: 'Email',
    phoneNumber: 'Phone Number',
    countryCode: 'Country Code',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    password: 'Password',
    role: 'Role',
    isSuperuser: 'Is Superuser',
    yes: 'Yes',
    no: 'No',
    createAdminUser: 'Create Admin User',
    editAdminUser: 'Edit Admin User',
    adminCreatedSuccess: 'Admin User created successfully',
    adminUpdatedSuccess: 'Admin User updated successfully',
    emailRequired: 'Email is required',
    phoneRequired: 'Phone Number is required',
    usernameRequired: 'Username is required',
    passwordRequired: 'Password is required',


    // RoleList Table
    roleList: 'Role List',
    searchRoles: 'Search roles...',
    addRole: 'Add Role',
    slNo: 'SL No',
    uuid: 'UUID',
    roleName: 'Role Name',
    description: 'Description',
    permissionsCount: 'Permissions Count',
    permissions: 'Permissions',
    actionLabel: 'Action',
    edit: 'Edit',
    noRolesFound: 'No roles match the search query.',

    // Add/Edit Role Modal
    addNewRole: 'Add New Role',
    editRole: 'Edit Role',
    roleNameRequired: 'Role Name *',
    describeResponsibilities: "Describe the role's responsibilities...",
    selectPermissions: 'Select Permissions',
    selected: 'selected',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    filterPermissions: 'Filter permissions...',
    noPermissionsMatch: 'No permissions match the filter query.',
    cancel: 'Cancel',
    saveRole: 'Save Role',
    updateRole: 'Update Role',
    submitting: 'Submitting...',

    // Alerts/Popups
    nameRequiredError: 'Role Name is required',
    selectAtLeastOneError: 'Select at least one permission',
    roleCreatedSuccess: 'Role created successfully',
    roleUpdatedSuccess: 'Role updated successfully',
    loadingLabel: 'Loading...'
  },
  bn: {
    // Sidebar
    dashboard: 'ড্যাশবোর্ড',
    trip: 'ট্রিপ',
    customer: 'গ্রাহক',
    rider: 'রাইডার',
    settings: 'সেটিংস',
    carSetup: 'কার সেটআপ',
    action: 'অ্যাকশন',
    actionWithLanguage: 'ভাষাসহ অ্যাকশন',
    rolePermission: 'ভূমিকা ও অনুমতি',
    driverSubscription: 'ড্রাইভার সাবস্ক্রিপশন',
    userSetting: 'ব্যবহারকারী সেটিংস',
    adminUser: 'এডমিন ব্যবহারকারী',
    actionsHeader: 'অ্যাকশনসমূহ',
    signOut: 'লগ আউট',

    // AdminUser List Page
    adminUserList: 'এডমিন ব্যবহারকারী তালিকা',
    firstName: 'প্রথম নাম',
    lastName: 'শেষ নাম',
    username: 'ব্যবহারকারীর নাম',
    email: 'ইমেল',
    phoneNumber: 'ফোন নম্বর',
    countryCode: 'কান্ট্রি কোড',
    status: 'অবস্থা',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    password: 'পাসওয়ার্ড',
    role: 'ভূমিকা',
    isSuperuser: 'সুপার ইউজার?',
    yes: 'হ্যাঁ',
    no: 'না',
    createAdminUser: 'এডমিন ব্যবহারকারী তৈরি করুন',
    editAdminUser: 'এডমিন ব্যবহারকারী সম্পাদনা করুন',
    adminCreatedSuccess: 'এডমিন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে',
    adminUpdatedSuccess: 'এডমিন ব্যবহারকারী সফলভাবে আপডেট করা হয়েছে',
    emailRequired: 'ইমেল আবশ্যক',
    phoneRequired: 'ফোন নম্বর আবশ্যক',
    usernameRequired: 'ব্যবহারকারীর নাম আবশ্যক',
    passwordRequired: 'পাসওয়ার্ড আবশ্যক',


    // RoleList Table
    roleList: 'ভূমিকা তালিকা',
    searchRoles: 'ভূমিকা খুঁজুন...',
    addRole: 'ভূমিকা যোগ করুন',
    slNo: 'ক্রমিক নং',
    uuid: 'ইউইউআইডি',
    roleName: 'ভূমিকার নাম',
    description: 'বিবরণ',
    permissionsCount: 'অনুমতির সংখ্যা',
    permissions: 'অনুমতিসমূহ',
    actionLabel: 'অ্যাকশন',
    edit: 'সম্পাদনা',
    noRolesFound: 'অনুসন্ধানের সাথে কোনো ভূমিকা মেলেনি।',

    // Add/Edit Role Modal
    addNewRole: 'নতুন ভূমিকা যোগ করুন',
    editRole: 'ভূমিকা সম্পাদনা করুন',
    roleNameRequired: 'ভূমিকার নাম *',
    describeResponsibilities: 'ভূমিকার দায়িত্ব বর্ণনা করুন...',
    selectPermissions: 'অনুমতি নির্বাচন করুন',
    selected: 'নির্বাচিত',
    selectAll: 'সব নির্বাচন করুন',
    clearAll: 'সব মুছুন',
    filterPermissions: 'অনুমতি ফিল্টার করুন...',
    noPermissionsMatch: 'ফিল্টারের সাথে কোনো অনুমতি মেলেনি।',
    cancel: 'বাতিল',
    saveRole: 'ভূমিকা সংরক্ষণ করুন',
    updateRole: 'ভূমিকা আপডেট করুন',
    submitting: 'জমা হচ্ছে...',

    // Alerts/Popups
    nameRequiredError: 'ভূমিকার নাম আবশ্যক',
    selectAtLeastOneError: 'কমপক্ষে একটি অনুমতি নির্বাচন করুন',
    roleCreatedSuccess: 'ভূমিকা সফলভাবে তৈরি হয়েছে',
    roleUpdatedSuccess: 'ভূমিকা সফলভাবে আপডেট হয়েছে',
    loadingLabel: 'লোড হচ্ছে...'
  }
};

export const useTranslation = () => {
  const context = useContext(AuthContextTrippy);
  const lang = context ? context.language : 'en';

  return (key: keyof typeof translations['en']) => {
    const activeLang = (lang === 'bn' || lang === 'en') ? lang : 'en';
    return translations[activeLang]?.[key] || translations['en'][key] || key;
  };
};
