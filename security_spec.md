# Security Specifications & Data Invariants

## Data Invariants
1. **User Preferences Integrity**: A user profile setting preferences can only be created or modified if `request.auth.uid == userId`. Modifying other users' configurations is strictly prohibited. Modifying `email` is locked post-creation.
2. **Travel Diary Identity Integrity**: Any published `TravelSnapshot` must have its `userId` field exactly equal to `request.auth.uid` to prevent identity spoofing.
3. **Immutability of Snapshot Ownership**: Once a Travel Diary snapshot is created, its owner (`userId`) and creation timestamp (`createdAt`) are immutable.
4. **Validation Limits**: Strings (such as the text description of travel snapshots) must be capped at 10,000 characters to prevent database exhaustion denial of wallet attacks. Document ID characters are strictly alphanumeric.
5. **Verified Users Constraint**: All writes must require an authenticated session where `request.auth != null`.

---

## The "Dirty Dozen" Malicious Payloads

### 1. Identity Spoof: Write preferences to another user's profile
- **Endpoint**: `users/malicious_attacker_uid`
- **Payload**: `{"email": "attacker@victim.com", "units": "imperial"}` attempting to target `userId = "victim_user_123"`
- **Result**: `Permission Denied`

### 2. Privilege Escalation: Self-promote to role or bypass locked keys on User
- **Endpoint**: `users/user_uid`
- **Payload**: `{"email": "user@domain.com", "isAdmin": true, "super_access": true}`
- **Result**: `Permission Denied`

### 3. Identity Spoof: Submit Travel Snapshot with victim's `userId`
- **Endpoint**: `travelSnapshots/some_snapshot_uuid`
- **Payload**: `{"userId": "victim_uid", "text": "Hacked!", "locationName": "Tokyo", "createdAt": 1780000000}`
- **Result**: `Permission Denied`

### 4. Shadow Column: Write unknown field into `TravelSnapshot`
- **Endpoint**: `travelSnapshots/some_snapshot_uuid`
- **Payload**: `{"userId": "my_uid", "text": "Holidays!", "locationName": "Kyoto", "createdAt": 1780000000, "malicious_injection": "any"}`
- **Result**: `Permission Denied`

### 5. Content Poisoning: Extremely large document ID
- **Endpoint**: `travelSnapshots/` with dynamic ID constructed of 2000 junk characters.
- **Payload**: `{"userId": "my_uid", "text": "Valid", "locationName": "Kyoto", "createdAt": 1780000000}`
- **Result**: `Permission Denied`

### 6. Time Spoof: Arbitrary non-timestamp in `createdAt`
- **Endpoint**: `travelSnapshots/some_snapshot_uuid`
- **Payload**: `{"userId": "my_uid", "text": "Beach!", "locationName": "Nice", "createdAt": "yesterday"}`
- **Result**: `Permission Denied`

### 7. Saved Place Spoof: Attacker edits somebody else's SavedPlace document
- **Endpoint**: `users/victim_user/savedPlaces/place_123`
- **Payload**: `{"placeId": "place_123", "displayName": "Attacker spot", "savedAt": 1234567}`
- **Result**: `Permission Denied`

### 8. Value Poisoning: Toggle units to invalid enum option
- **Endpoint**: `users/my_user_uid`
- **Payload**: `{"email": "me@me.com", "units": "lightyears", "mapStyle": "streets"}`
- **Result**: `Permission Denied`

### 9. Value Poisoning: Set mapStyle to something other than streets/satellite
- **Endpoint**: `users/my_user_uid`
- **Payload**: `{"email": "me@me.com", "units": "metric", "mapStyle": "cartoon"}`
- **Result**: `Permission Denied`

### 10. Update Spoof: Alter user email after creation
- **Endpoint**: `users/my_user_uid`
- **Payload** (existing email is "user@me.com"): `{"email": "changed@me.com", "units": "metric"}`
- **Result**: `Permission Denied`

### 11. Overwrite Spoof: Override travel diary poster name/photo URL in update
- **Endpoint**: `travelSnapshots/snapshot_123`
- **Payload**: `{"userId": "my_uid", "text": "New Text", "userDisplayName": "Attacking Agent", "createdAt": 123456789}` where email or displayName is altered.
- **Result**: `Permission Denied`

### 12. Deletion Attack: Delete snapshots of other users
- **Endpoint**: `travelSnapshots/snapshot_authored_by_victim`
- **Requestor**: Authenticated user with different uid than owner.
- **Result**: `Permission Denied`

---

## Rules Verification Tests
We secure our paths using exact static verification and ABAC assertions in the `firestore.rules` compiler matching these 12 invariants.
