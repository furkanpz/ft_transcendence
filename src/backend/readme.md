
# BACKEND

## AUTH ENDPOINTS

#### SIGN-IN

```http
  POST /api/auth/sign-in
```

| Parametre | Tip     | Açıklama                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |
| `password` | `string` | **Gerekli**. Min-Max 6-64 |

Eğer 2fa aktif ise Aşşağıdaki Gibi Response Döner
```example
  {success: true, message:"2FAREQUIRED", {username: "testuser"}}
```

#### SIGN-IN (STEP-TWO FOR 2FA)

```http
  POST /api/auth/2fa/login
```

| Parametre | Tip     | Açıklama                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |
| `OTP` | `number` | **Gerekli**. Min-Max 6-64 |

#### SIGN-UP

```http
  POST /api/auth/sign-up
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Gerekli**. |
| `username`      | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |
| `password` | `string` | **Gerekli**. Min-Max 6-64 |


#### LOGOUT

```http
  GET /api/auth/logout
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `access_token`      | `string` | **Gerekli**. Login Sonrası Cookiede Saklanır!|


#### Account Recovery (STEP 1)

```http
  POST /api/auth/account_recovery
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Gerekli**. |

Eğer böyle bir hesap varsa mail adresine link gönderilcek!

#### Account Recovery (STEP 2)

```http
  GET /api/auth/account_recovery?verify=&email=
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `verify`      | `string` | **Gerekli**. |
| `email`      | `string` | **Gerekli**. |

Başarılı durumda aşşağıdaki döner
```example
  {success: true, message:"STEPTWOAUTHREQ", {email: "test@gmail.com", verifycode: "123456"}}
```
#### Account Recovery (STEP 2)

```http
  GET /api/auth/account_recovery?verify=&email=
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `verify`      | `string` | **Gerekli**. |
| `email`      | `string` | **Gerekli**. |

#### Account Recovery (STEP 3 - LAST STEP)

```http
  POST /api/auth/account_recovery/verify
```

| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `verifycode`      | `string` | **Gerekli**. |
| `email`      | `string` | **Gerekli**. |
| `new_password`      | `string` | **Gerekli**. |
| `new_re_password`      | `string` | **Gerekli**. |

Bu Aşama STEP 2 sonrasında 15 Dakika içinde doldurulmalıdır yoksa iptal olur!

#### GOOGLE LOGIN (REMOTE AUTH)

```http
  GET /api/auth/login/google
```

## USER ENDPOINTS (JWT REQUIRED)

#### PROFILE

```http
  GET /api/user/profile
```
#### CHANGE PASSWORD

```http
  PUT /api/user/password
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `password`      | `string` | **Gerekli**. Min-Max 6-64|
| `new_password`      | `string` | **Gerekli**. Min-Max 6-64|
| `new_re_password`      | `string` | **Gerekli**. Min-Max 6-64|
| `user_id`      | `number` | **ADMIN için**. Min  1|

#### CHANGE USERNAME

```http
  PUT /api/user/password
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `username`      | `string` | **Gerekli**. Min-Max 3-36 pattern:'^[a-zA-Z0-9_]+$' |

#### SET 2FA

```http
  POST /api/auth/2fa
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `t2type`      | `boolean` | **Gerekli**.|

Başarılı ise aşşağıdaki gibi response döner ve verify bekler
```example
  {success: true, message:"OTP sent successfully"}
```

#### 2FA VERIFY (FOR SET)

```http
  POST /api/auth/2fa/verify
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `OTP`      | `number` | **Gerekli**.|


#### LIST FRIENDS

```http
  GET /api/user/friends
```

#### FRIENDS DETAILS

```http
  POST /api/user/friends/details
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `friends`      | `array[number]` | **Gerekli**. Min  1|

#### FRIEND REQUEST

```http
  POST /api/user/friends/request
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `friend_id`      | `number` | **Gerekli**|
| `request_type`      | `enum string` | **Gerekli**. "Pending" - "Accepted" - "Remove"|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|



#### BLOCK USER

```http
  POST /api/user/friends/block
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `blocked_id`      | `number` | **Gerekli**|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|

#### LIST BLOCKED USER

```http
  GET /api/user/friends/block
```

#### UNBLOCK USER

```http
  DELETE /api/user/friends/:uBLockId?user_id=
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `blocked_id`      | `number` | **Gerekli**|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|


#### GET ROOMS

```http
  GET /api/chat/rooms
```


#### JOIN ROOM

```http
  POST /api/chat/rooms/:roomId/join
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `roomId`      | `string` | **Gerekli**|


#### GET ROOM HISTORY

```http
  GET /rooms/:roomId/history?limit=
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `roomId`      | `string` | **Gerekli**|
| `limit`      | `string` | **Gerekli Değil**|


## ADMIN ENDPOINTS (JWT REQUIRED - ROLE REQUIRED)

#### FRIEND REQUEST

```http
  POST /api/user/friends/request
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `newRole`      | `number` | **Gerekli**|
| `request_type`      | `enum string` | **Gerekli**. "USER" - "ADMIN"|
| `user_id`      | `number` | **ADMIN için**. Girilen User Adına İstek Yönetimi|


#### CREATE CHAT ROOM

```http
  POST /api/chat/rooms
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `name`      | `string` | **Gerekli** Min-Max 1 - 100 |
| `isPrivate`      | `boolean` | **Gerekli Değil**.|

#### DELETE CHAT ROOM

```http
  DELETE /api/chat/rooms/:roomId
```
| Parametre | Tip     | Açıklama                       |
| :-------- | :------- | :-------------------------------- |
| `roomId`      | `string` | **Gerekli**|