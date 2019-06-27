import express from 'express'
import Screen from './model'
import Device from './modelDevice'

const router = express.Router()

router.get('/all', (req, res) => {
  Screen.find().then(screens => {
    if (!screens) {
      res.status(404).json({ error: 'Not Found' })
    }
    res.json(screens)
  })
})

router.get('/:id', (req, res) => {
  Screen.findById(req.params.id).then(screen => {
    if (!screen) {
      res.status(404).json({ error: 'Not Found' })
    }
    var opts = [{ path: 'screen', select: 'title', model: 'screen' }]
    Screen.populate(screen, opts, function(err, user) {
      res.json(user)
    })
  })
})

router.get('/device/:id', (req, res) => {
  Device.findById(req.params.id).then(device => res.json(device))
})

const createScreen = async (screen, parent) => {
  const { title, description } = screen
  const newScreen = Screen({
    title,
    description,
    parent: parent
  })
  const childrenRefs = parent.children
  newScreen.save().then(async newScreenFromDB => {
    childrenRefs.push(newScreenFromDB._id)
    if (screen.children.length) {
      screen.children.forEach(async child => {
        await createScreen(child, newScreenFromDB)
      })
    }
    await Screen.findByIdAndUpdate(
      parent._id,
      {
        children: childrenRefs
      },
      { new: true, useFindAndModify: false }
    )
  })
}

router.post('/createMap', async (req, res) => {
  const { titleDevice, descriptionDevice } = req.body
  const { title, description } = req.body.map
  let rootScreen = new Screen({
    title,
    description
  })
  rootScreen = await rootScreen.save()
  let device = new Device({
    title: titleDevice,
    description: descriptionDevice,
    map: rootScreen
  })
  await device.save()
  await req.body.map.children.forEach(async screen => {
    await createScreen(screen, rootScreen)
  })
  res.json(device)
})

router.post('/createOne', async (req, res) => {
  const newScreen = new Screen(req.body)
  const parent = await Screen.findById(req.body.parent)
  newScreen
    .save()
    .then(async screen => {
      parent.children.push(screen._id)
      await parent.save()
      res.json(screen)
    })
    .catch(err => console.log(err))
})

const deleteScreen = async screen => {
  if (screen.children.length) {
    screen.children.forEach(child => {
      deleteScreen(child)
    })
  }
  await Screen.findByIdAndRemove(screen._id)
}

router.delete('/delete/:id', async (req, res) => {
  Screen.findById(req.params.id).then(async screen => {
    await deleteScreen(screen)
    res.json(screen)
  })
})

router.put('/update/:id', async (req, res) => {
  if (req.params.id === req.body.parent) {
    return res.status(400).json({ error: 'pode não po' })
  }
  const oldParentId = (await Screen.findById(req.params.id)).parent
  Screen.findById(req.body.parent || oldParentId).then(
    async newParentConfirm => {
      if (newParentConfirm) {
        const screenUpdated = await Screen.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            useFindAndModify: true,
            new: true
          }
        )
        if (req.body.parent) {
          const newParentId = req.body.parent
          const newParent = await Screen.findById(newParentId)

          if (oldParentId != newParentId) {
            const oldParent = await Screen.findById(oldParentId)
            const index = oldParent.children.indexOf(screenUpdated._id)
            oldParent.children.splice(index, 1)
            newParent.children.push(screenUpdated._id)
            await oldParent.save()
            await newParent.save()
          }
        }
        res.json(screenUpdated)
      }
    }
  )
})

export default router
